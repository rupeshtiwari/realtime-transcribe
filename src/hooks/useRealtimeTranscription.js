import { useState, useRef, useCallback, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export function useRealtimeTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState({ text: 'Idle', isActive: false });
  const [error, setError] = useState(null);
  
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const clientSecretRef = useRef(null);
  
  // Proper Zustand store access - use hooks directly
  const addTranscriptMessage = useSessionStore((state) => state.addTranscriptMessage);
  const setCurrentSpeaker = useSessionStore((state) => state.setCurrentSpeaker);
  const currentSpeaker = useSessionStore((state) => state.currentSpeaker);

  // Handle Realtime API events
  const handleRealtimeEvent = useCallback((evt) => {
    try {
      if (!evt || typeof evt !== 'object' || evt === null) {
        console.warn('Invalid event received:', evt);
        return;
      }

      const type = String(evt.type || '');
      console.log('Realtime event:', type, evt);

      // Handle session updates
      if (type === 'session.updated') {
        const statusText = evt.session?.status || 'Connected';
        setStatus({ text: statusText, isActive: true });
        console.log('Session updated:', statusText);
        return;
      }

      // Handle conversation.item.input_audio_transcription.completed events
      // This is the main event type for completed transcription segments
      if (type === 'conversation.item.input_audio_transcription.completed') {
        const item = evt.item;
        if (!item || typeof item !== 'object' || item === null) {
          console.warn('Invalid item in transcription event:', item);
          return;
        }

        if (item.content && Array.isArray(item.content)) {
          // Find the transcript content in the item
          for (const content of item.content) {
            if (!content || typeof content !== 'object') continue;
            
            if (content.type === 'input_audio_transcription' && content.transcript) {
              const transcript = String(content.transcript).trim();
              if (transcript) {
                console.log('Adding transcript message:', transcript);
                addTranscriptMessage(transcript, currentSpeaker);
                return;
              }
            }
            // Also check for text field
            if (content.text && typeof content.text === 'string') {
              const transcript = content.text.trim();
              if (transcript) {
                console.log('Adding transcript message (text):', transcript);
                addTranscriptMessage(transcript, currentSpeaker);
                return;
              }
            }
          }
        }
        // Fallback: check for transcript at top level of item
        if (item.transcript && typeof item.transcript === 'string') {
          const transcript = item.transcript.trim();
          if (transcript) {
            console.log('Adding transcript message (top level):', transcript);
            addTranscriptMessage(transcript, currentSpeaker);
            return;
          }
        }
        return;
      }

      // Handle incremental transcript deltas (if any)
      if (type.includes('transcript') && typeof evt.delta === 'string' && evt.delta.trim()) {
        console.log('Adding transcript delta:', evt.delta.trim());
        addTranscriptMessage(evt.delta.trim(), currentSpeaker);
        return;
      }

      // Handle other transcript event shapes
      if (type.includes('transcript')) {
        const transcript = evt.transcript || evt.text;
        if (typeof transcript === 'string' && transcript.trim()) {
          console.log('Adding transcript (generic):', transcript.trim());
          addTranscriptMessage(transcript.trim(), currentSpeaker);
          return;
        }
      }

      // Handle nested content structures
      if (evt?.item && typeof evt.item === 'object' && evt.item !== null) {
        const item = evt.item;
        if (item.content && Array.isArray(item.content)) {
          for (const content of item.content) {
            if (!content || typeof content !== 'object') continue;
            
            if (content.type?.includes('transcript') || content.type?.includes('input_audio_transcription')) {
              const transcript = content.transcript || content.text;
              if (typeof transcript === 'string' && transcript.trim()) {
                console.log('Adding transcript (nested):', transcript.trim());
                addTranscriptMessage(transcript.trim(), currentSpeaker);
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling realtime event:', error, evt);
      // Don't crash the app, just log the error
    }
  }, [addTranscriptMessage, currentSpeaker]);

  const stopTranscription = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsRecording(false);
    setStatus({ text: 'Stopped', isActive: false });
    setError(null);
  }, []);

  const startTranscription = useCallback(async () => {
    setIsRecording(true);
    setStatus({ text: 'Select tab to capture…', isActive: false });
    setError(null);

    try {
      // 1. Capture tab audio using getDisplayMedia
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,   // required by browser UI for tab selection
        audio: true    // this is what we actually want
      });

      // Check if we got audio
      const audioTracks = displayStream.getAudioTracks();
      if (!audioTracks.length) {
        // Stop the video track if we got one
        displayStream.getVideoTracks().forEach(track => track.stop());
        throw new Error(
          'No audio track captured.\n\n' +
          'In Chrome, you must:\n' +
          '1. Pick a TAB (not "Entire Screen")\n' +
          '2. Enable "Share tab audio" checkbox\n\n' +
          'Please try again.'
        );
      }

      // Create audio-only stream for transcription
      const audioOnlyStream = new MediaStream([audioTracks[0]]);
      localStreamRef.current = audioOnlyStream;

      setStatus({ text: 'Audio captured, connecting…', isActive: false });

      // Handle when user stops sharing (stop video track)
      displayStream.getVideoTracks()[0].onended = () => {
        stopTranscription();
      };

      // Handle when audio track ends
      audioTracks[0].onended = () => {
        stopTranscription();
      };

      // 2. Get ephemeral session secret from our server
      const sessionResp = await fetch('/api/session', { method: 'POST' });
      const sessionData = await sessionResp.json();
      if (!sessionResp.ok) {
        setIsRecording(false);
        setStatus({ text: 'Failed to create session', isActive: false });
        throw new Error('Failed to create session');
      }

      const EPHEMERAL_KEY = sessionData.client_secret;
      const REALTIME_MODEL = sessionData.realtime_model || 'gpt-4o-realtime-preview';
      clientSecretRef.current = EPHEMERAL_KEY;

      if (!EPHEMERAL_KEY) {
        throw new Error('No client_secret received from server');
      }

      // 3. Create PeerConnection + DataChannel (events)
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus({ text: 'Connected (transcribing)…', isActive: true });

        // Configure transcription-only behavior with gpt-4o-transcribe and server VAD
        const msg = {
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions:
              'You are a realtime transcription engine. Only output transcription events. Do not generate replies.',
            input_audio_transcription: {
              model: 'gpt-4o-transcribe',
            },
            turn_detection: {
              type: 'server_vad',
            },
          },
        };
        dc.send(JSON.stringify(msg));
      };

      dc.onmessage = (e) => {
        try {
          if (!e || !e.data) {
            console.warn('Empty message received');
            return;
          }
          const evt = JSON.parse(e.data);
          console.log('Realtime event received:', evt.type || 'unknown');
          handleRealtimeEvent(evt);
        } catch (err) {
          console.error('Error parsing realtime message:', err, e.data);
        }
      };

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        setError('Data channel error');
        setIsRecording(false);
      };

      dc.onclose = () => {
        console.log('Data channel closed');
        setStatus({ text: 'Connection closed', isActive: false });
        setIsRecording(false);
        // Clean up on close
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (dcRef.current) {
          dcRef.current = null;
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('Connection state:', state);
        if (state === 'failed' || state === 'disconnected') {
          setStatus({ text: `Disconnected (${state})`, isActive: false });
          setIsRecording(false);
        } else if (state === 'connected') {
          setStatus({ text: 'Connected', isActive: true });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('ICE connection state:', state);
        if (state === 'failed') {
          setError('ICE connection failed');
          setIsRecording(false);
        }
      };

      // 4. Add audio track to PeerConnection
      const streamAudioTracks = audioOnlyStream.getAudioTracks();
      console.log(`Adding ${streamAudioTracks.length} audio track(s) to PeerConnection`);
      for (const track of streamAudioTracks) {
        console.log('Audio track:', track.label, track.enabled, track.readyState);
        pc.addTrack(track, audioOnlyStream);
      }

      // Verify tracks were added
      const senders = pc.getSenders();
      console.log(`PeerConnection has ${senders.length} senders`);
      senders.forEach((sender, idx) => {
        const track = sender.track;
        if (track) {
          console.log(`Sender ${idx}: ${track.kind} - ${track.label} (enabled: ${track.enabled}, state: ${track.readyState})`);
        }
      });

      setStatus({ text: 'Connecting to OpenAI…', isActive: false });

      // 5. WebRTC SDP exchange with OpenAI Realtime
      // When using sessions API, we use the client_secret and the model from the session
      console.log('Creating SDP offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: false, // We're only sending audio
        offerToReceiveVideo: false,
      });
      console.log('SDP offer created, setting local description...');
      await pc.setLocalDescription(offer);
      console.log('Local description set');

      // Use the session-based endpoint format
      const realtimeUrl = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
        REALTIME_MODEL
      )}`;
      console.log(`Connecting to OpenAI Realtime API: ${realtimeUrl.substring(0, 50)}...`);

      const sdpResp = await fetch(realtimeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      const answerSdp = await sdpResp.text();
      if (!sdpResp.ok) {
        console.error('SDP exchange failed:', sdpResp.status, answerSdp);
        throw new Error(`Failed to exchange SDP with Realtime (${sdpResp.status}): ${answerSdp.substring(0, 200)}`);
      }

      console.log('SDP answer received, setting remote description...');
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log('Remote description set, connection established');

    } catch (err) {
      console.error('Start error:', err);
      setError(err.message);
      setStatus({ text: `Error: ${err.message}`, isActive: false });
      setIsRecording(false);
      
      // Cleanup on error
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (dcRef.current) {
        dcRef.current.close();
        dcRef.current = null;
      }
    }
  }, [handleRealtimeEvent, stopTranscription]);

  const toggleSpeaker = useCallback(() => {
    const newSpeaker = currentSpeaker === 'coach' ? 'client' : 'coach';
    setCurrentSpeaker(newSpeaker);
  }, [currentSpeaker, setCurrentSpeaker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    isRecording,
    status,
    error,
    startTranscription,
    stopTranscription,
    toggleSpeaker,
  };
}
