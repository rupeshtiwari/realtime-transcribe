import { useState, useRef, useCallback } from 'react';

export function useRealtimeTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [status, setStatus] = useState({ text: 'Idle', isActive: false });
  const [currentSpeaker, setCurrentSpeaker] = useState('client');
  
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);

  const startTranscription = useCallback(async () => {
    setIsRecording(true);
    setStatus({ text: 'Select tab to capture…', isActive: false });

    try {
      // Capture tab audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTracks = displayStream.getAudioTracks();
      if (!audioTracks.length) {
        alert('No audio track captured. Please select a tab and enable "Share tab audio".');
        setIsRecording(false);
        return;
      }

      const audioOnlyStream = new MediaStream([audioTracks[0]]);
      localStreamRef.current = audioOnlyStream;

      // Create WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // Add audio track
      audioOnlyStream.getTracks().forEach((track) => {
        pc.addTrack(track, audioOnlyStream);
      });

      // Create data channel for Realtime API
      const dc = pc.createDataChannel('realtime', { ordered: true });
      dcRef.current = dc;

      // Get session token from server
      const sessionResp = await fetch('/api/session', { method: 'POST' });
      if (!sessionResp.ok) {
        throw new Error('Failed to create session');
      }
      const { client_secret } = await sessionResp.json();

      // Handle data channel messages
      dc.onmessage = (event) => {
        try {
          const evt = JSON.parse(event.data);
          handleRealtimeEvent(evt);
        } catch (e) {
          console.error('Error parsing event:', e);
        }
      };

      // Connect to OpenAI Realtime API
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
        throw new Error('Failed to connect to Realtime API');
      }

      const { sdp: answerSdp } = await sdpResp.json();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus({ text: 'Recording…', isActive: true });
    } catch (err) {
      console.error('Start error:', err);
      setStatus({ text: `Error: ${err.message}`, isActive: false });
      setIsRecording(false);
    }
  }, []);

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
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCurrentSpeaker((prev) => (prev === 'coach' ? 'client' : 'coach'));
  }, []);

  const handleRealtimeEvent = (evt) => {
    if (!evt || typeof evt !== 'object') return;

    const type = String(evt.type || '');

    if (type === 'session.updated') {
      const statusText = evt.session?.status || 'Connected';
      setStatus({ text: statusText, isActive: true });
    }

    if (type === 'conversation.item.input_audio_transcription.completed') {
      const transcript = evt.item?.input_audio_transcription?.transcript;
      if (transcript && transcript.trim()) {
        addTranscriptMessage(transcript.trim(), currentSpeaker);
      }
    }

    if (type === 'response.audio_transcript.delta' || type === 'response.text.delta') {
      const text = evt.delta || evt.text || '';
      if (text && text.trim()) {
        addTranscriptMessage(text.trim(), currentSpeaker);
      }
    }
  };

  const addTranscriptMessage = (text, speaker) => {
    setTranscriptMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        speaker,
        timestamp: new Date(),
      },
    ]);
  };

  return {
    isRecording,
    transcriptMessages,
    status,
    currentSpeaker,
    startTranscription,
    stopTranscription,
    toggleSpeaker,
  };
}
