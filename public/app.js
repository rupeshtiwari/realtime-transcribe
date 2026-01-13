let pc = null;
let dc = null;
let localStream = null;

const els = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  transcript: document.getElementById("transcript"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  debugLog: document.getElementById("debugLog"),
};

function setStatus(text, on) {
  els.statusText.textContent = text;
  els.statusDot.classList.toggle("status__dot--on", Boolean(on));
}

function logDebug(line) {
  const ts = new Date().toISOString().slice(11, 19);
  els.debugLog.textContent += `[${ts}] ${line}\n`;
  els.debugLog.scrollTop = els.debugLog.scrollHeight;
}

function appendTranscript(text) {
  if (!text) return;
  const needsSpace =
    els.transcript.value.length > 0 &&
    !els.transcript.value.endsWith("\n") &&
    !els.transcript.value.endsWith(" ");
  els.transcript.value += (needsSpace ? " " : "") + text;
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function appendTranscriptLine(text) {
  if (!text) return;
  const suffix = els.transcript.value.length > 0 ? "\n" : "";
  els.transcript.value += suffix + text;
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Heuristic: handle multiple event shapes for transcript streaming.
function handleRealtimeEvent(evt) {
  if (!evt || typeof evt !== "object") return;

  const type = String(evt.type || "");
  if (type) logDebug(type);

  // Common: incremental transcript deltas
  const isTranscriptDelta =
    type.includes("transcript") && typeof evt.delta === "string";
  if (isTranscriptDelta) {
    appendTranscript(evt.delta);
    return;
  }

  // Common: completed utterance/segment
  const completedTranscript =
    typeof evt.transcript === "string"
      ? evt.transcript
      : typeof evt.text === "string" && type.includes("transcript")
        ? evt.text
        : null;

  if (completedTranscript) {
    appendTranscriptLine(completedTranscript.trim());
    return;
  }

  // Some servers embed transcript in nested structures.
  const nested =
    evt?.item?.content?.find?.((c) => c?.type?.includes?.("transcript")) ||
    evt?.content?.find?.((c) => c?.type?.includes?.("transcript")) ||
    null;
  if (nested && typeof nested.text === "string") {
    appendTranscriptLine(nested.text.trim());
  }
}

async function start() {
  els.startBtn.disabled = true;
  setStatus("Requesting microphone…", false);

  // 1) Get ephemeral session secret from our server (never expose API key in browser).
  const sessionResp = await fetch("/api/session", { method: "POST" });
  const sessionData = await sessionResp.json();
  if (!sessionResp.ok) {
    els.startBtn.disabled = false;
    setStatus("Failed to create session", false);
    logDebug(`Session error: ${JSON.stringify(sessionData)}`);
    throw new Error("Failed to create session");
  }

  const EPHEMERAL_KEY = sessionData.client_secret;
  const REALTIME_MODEL = sessionData.realtime_model;

  // 2) Create PeerConnection + DataChannel (events).
  pc = new RTCPeerConnection();
  dc = pc.createDataChannel("oai-events");

  dc.onopen = () => {
    setStatus("Connected (listening)…", true);
    els.stopBtn.disabled = false;

    // Configure transcription-only behavior.
    const msg = {
      type: "session.update",
      session: {
        modalities: ["text"],
        instructions:
          "You are a realtime transcription engine. Only output transcription events. Do not generate replies.",
        input_audio_transcription: { model: "gpt-4o-transcribe" },
        turn_detection: {
          type: "server_vad",
          // Keep defaults on server if unsupported; this is a reasonable baseline.
          // threshold: 0.5,
          // prefix_padding_ms: 300,
          // silence_duration_ms: 800,
        },
      },
    };
    dc.send(JSON.stringify(msg));
    logDebug("Sent session.update (transcription-only + server_vad)");
  };

  dc.onmessage = (e) => {
    const evt = safeJsonParse(e.data);
    if (!evt) {
      logDebug(`Non-JSON message: ${String(e.data).slice(0, 160)}`);
      return;
    }
    handleRealtimeEvent(evt);
  };

  pc.onconnectionstatechange = () => {
    logDebug(`pc.connectionState=${pc.connectionState}`);
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      setStatus(`Disconnected (${pc.connectionState})`, false);
    }
  };

  // 3) Capture mic and add as track.
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
  for (const track of localStream.getTracks()) {
    pc.addTrack(track, localStream);
  }

  setStatus("Connecting…", false);

  // 4) WebRTC SDP exchange with OpenAI Realtime.
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const realtimeUrl = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
    REALTIME_MODEL,
  )}`;

  const sdpResp = await fetch(realtimeUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp,
  });

  const answerSdp = await sdpResp.text();
  if (!sdpResp.ok) {
    logDebug(`SDP error: ${answerSdp}`);
    throw new Error("Failed to exchange SDP with Realtime");
  }

  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
}

async function stop() {
  els.stopBtn.disabled = true;
  setStatus("Stopping…", false);

  try {
    dc?.close();
  } catch {}
  dc = null;

  try {
    pc?.close();
  } catch {}
  pc = null;

  try {
    for (const t of localStream?.getTracks?.() || []) t.stop();
  } catch {}
  localStream = null;

  setStatus("Idle", false);
  els.startBtn.disabled = false;
}

els.startBtn.addEventListener("click", () => {
  start().catch((err) => {
    logDebug(`Start failed: ${String(err?.message || err)}`);
    stop();
  });
});

els.stopBtn.addEventListener("click", () => {
  stop();
});

