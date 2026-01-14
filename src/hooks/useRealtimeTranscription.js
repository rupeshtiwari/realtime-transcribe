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
  
  const { addTranscriptMessage, setCurrentSpeaker, currentSpeaker } = useSessionStore();

  const startTranscription = useCallback(async () => {
    setIsRecording(true);
    setStatus({ text: 'Select tab to capture…', isActive: false });
    setError(null);

    try {
      // 1. Capture tab audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTracks = displayStream.getAudioTracks();
      if (!audioTracks.length) {
        throw new Error(
          'No audio track captured.\n\n' +
          'In Chrome, you must:\n' +
          '1. Pick a TAB (not "Entire Screen")\n' +
          '2. Enable "Share tab audio" checkbox\n\n' +
          'Please try again.'
        );
      }

      // Create audio-only stream
      const audioOnlyStream = new MediaStream([audioTracks[0]]);
      localStreamRef.current = audioOnlyStream;

      // 2. Create WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // Add audio tracks
      audioOnlyStream.getTracks().forEach((track) => {
        pc.addTrack(track, audioOnlyStream);
      });

      // 3. Create data channel for Realtime API
      const dc = pc.createDataChannel('realtime', { ordered: true });
      dcRef.current = dc;

      // 4. Get session token from server
      const sessionResp = await fetch('/api/session', { method: 'POST' });
      if (!sessionResp.ok) {
        throw new Error('Failed to create session');
      }
      const { client_secret } = await sessionResp.json();
      clientSecretRef.current = client_secret;

      // 5. Handle data channel messages
      dc.onmessage = (event) => {
        try {
          const evt = JSON.parse(event.data);
          handleRealtimeEvent(evt);
        } catch (e) {
          console.error('Error parsing event:', e);
        }
      };

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        setError('Data channel error');
      };

      // 6. Create offer and connect to OpenAI Realtime API
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${client_secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          modalities: ['audio', 'text'],
          instructions: 'You are a real-time transcription assistant. Transcribe the audio accurately.',
          input_audio_format: 'pcm24',
          output_audio_format: 'pcm24',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          temperature: 0.8,
          max_response_output_tokens: 4096,
          session: {
            modalities: ['audio', 'text'],
            instructions: 'Transcribe the audio. Do not respond, only transcribe.',
            voice: 'alloy',
            input_audio_transcription: {
              model: 'whisper-1',
            },
          },
          sdp: offer.sdp,
        }),
      });

      if (!sdpResp.ok) {
        const errorData = await sdpResp.json();
        throw new Error(`Failed to connect: ${JSON.stringify(errorData)}`);
      }

      const { sdp: answerSdp } = await sdpResp.json();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // 7. Handle connection state
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setStatus({ text: 'Recording…', isActive: true });
        } else if (state === 'disconnected' || state === 'failed') {
          setStatus({ text: 'Disconnected', isActive: false });
          setIsRecording(false);
        }
      };

      setStatus({ text: 'Recording…', isActive: true });
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

  const toggleSpeaker = useCallback(() => {
    const newSpeaker = currentSpeaker === 'coach' ? 'client' : 'coach';
    setCurrentSpeaker(newSpeaker);
  }, [currentSpeaker, setCurrentSpeaker]);

  // Handle Realtime API events
  const handleRealtimeEvent = useCallback((evt) => {
    if (!evt || typeof evt !== 'object') return;

    const type = String(evt.type || '');

    // Handle session updates
    if (type === 'session.updated') {
      const statusText = evt.session?.status || 'Connected';
      setStatus({ text: statusText, isActive: true });
    }

    // Handle transcription events
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const item = evt.item;
      if (item?.content) {
        for (const content of item.content) {
          if (content.type === 'input_audio_transcription' && content.transcript) {
            const transcript = content.transcript.trim();
            if (transcript) {
              addTranscriptMessage(transcript, currentSpeaker);
              return;
            }
          }
        }
      }
    }

    // Handle incremental updates
    if (type.includes('transcript') && typeof evt.delta === 'string' && evt.delta.trim()) {
      addTranscriptMessage(evt.delta.trim(), currentSpeaker);
    }
  }, [addTranscriptMessage, currentSpeaker]);

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
