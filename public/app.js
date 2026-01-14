let pc = null;
let dc = null;
let localStream = null;
let coachMicStream = null;
let clientTabStream = null;

let suggestionTimeout = null;
let lastSuggestionText = "";
let currentSession = null;
let analyzedSegments = []; // Track what's been analyzed
let conversationSegments = []; // Track conversation segments
let analysisNotebook = []; // Store all analysis results (notebook-style)
let db = null; // IndexedDB database
let saveTimeout = null; // Debounce for auto-save
let materialsLibrary = []; // Store mentoring materials library
let selectedMaterials = []; // Currently selected materials for session
let currentSpeaker = "client"; // "coach" or "client" - tracks who is speaking
let transcriptMessages = []; // Store transcript as messages with speaker info
let assistantMessages = []; // Store assistant chat messages

const els = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  transcript: document.getElementById("transcript"), // Keep for backward compatibility
  transcriptChat: document.getElementById("transcriptChat"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  debugLog: document.getElementById("debugLog"),
  audioMonitor: document.getElementById("audioMonitor"),
  bestReply: document.getElementById("bestReply"),
  alternate1: document.getElementById("alternate1"),
  alternate2: document.getElementById("alternate2"),
  nextQuestion: document.querySelector("#nextQuestion .next-question__text"),
  getSuggestionsBtn: document.getElementById("getSuggestionsBtn"),
  toggleSpeakerBtn: document.getElementById("toggleSpeakerBtn"),
  followupBtn: document.getElementById("followupBtn"),
  revisedStoryBtn: document.getElementById("revisedStoryBtn"),
  feedbackSummaryBtn: document.getElementById("feedbackSummaryBtn"),
  interviewPrepBtn: document.getElementById("interviewPrepBtn"),
  conversationAnalysisBtn: document.getElementById("conversationAnalysisBtn"),
  analysisResults: document.getElementById("analysisResults"),
  sessionModal: document.getElementById("sessionModal"),
  sessionForm: document.getElementById("sessionForm"),
  sessionInfo: document.getElementById("sessionInfo"),
  cancelSessionBtn: document.getElementById("cancelSessionBtn"),
  exportSessionBtn: document.getElementById("exportSessionBtn"),
  importSessionBtn: document.getElementById("importSessionBtn"),
  saveToDriveBtn: document.getElementById("saveToDriveBtn"),
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

// WhatsApp-style transcript functions
function addTranscriptMessage(text, speaker) {
  if (!text || !text.trim()) return;
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    speaker: speaker || currentSpeaker,
    timestamp: new Date(),
  };
  
  transcriptMessages.push(message);
  renderTranscriptChat();
  
  // Also update legacy transcript textarea for backward compatibility
  if (els.transcript) {
    const prefix = els.transcript.value ? "\n" : "";
    const speakerLabel = message.speaker === "coach" ? "Coach: " : "Client: ";
    els.transcript.value += prefix + speakerLabel + message.text;
  }
  
  // Enable analysis buttons when transcript has content
  updateAnalysisButtons();
}

function renderTranscriptChat() {
  if (!els.transcriptChat) return;
  
  if (transcriptMessages.length === 0) {
    els.transcriptChat.innerHTML = '<div class="transcript-chat__placeholder">Transcript will appear here as audio is captured...</div>';
    return;
  }
  
  let html = "";
  transcriptMessages.forEach(msg => {
    const speakerName = msg.speaker === "coach" 
      ? (currentSession?.candidateName ? "You" : "Coach")
      : (currentSession?.candidateName || "Client");
    const speakerInitial = speakerName.charAt(0).toUpperCase();
    const timeStr = msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    
    html += `
      <div class="transcript-message transcript-message--${msg.speaker}">
        <div class="transcript-message__avatar">${speakerInitial}</div>
        <div class="transcript-message__content">
          <div class="transcript-message__bubble">${escapeHtml(msg.text)}</div>
          <div class="transcript-message__meta">
            <span class="transcript-message__speaker">${escapeHtml(speakerName)}</span>
            <span class="transcript-message__time">${timeStr}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  els.transcriptChat.innerHTML = html;
  
  // Auto-scroll to bottom (like WhatsApp)
  els.transcriptChat.scrollTop = els.transcriptChat.scrollHeight;
}

function appendTranscript(text) {
  if (!text) return;
  // For incremental updates, append to last message or create new one
  if (transcriptMessages.length > 0) {
    const lastMsg = transcriptMessages[transcriptMessages.length - 1];
    // If last message was recent (within 2 seconds), append to it
    const timeDiff = Date.now() - lastMsg.timestamp.getTime();
    if (timeDiff < 2000) {
      lastMsg.text += (lastMsg.text.endsWith(" ") ? "" : " ") + text;
      renderTranscriptChat();
      return;
    }
  }
  // Otherwise create new message
  addTranscriptMessage(text, currentSpeaker);
}

function appendTranscriptLine(text) {
  if (!text) return;
  addTranscriptMessage(text, currentSpeaker);
}

// Generate coach reply suggestions from transcript
// Only generates on natural pauses (10+ seconds) or manual trigger
async function requestSuggestions() {
  // Clear any pending timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }

  // Wait 10 seconds after last transcript update before generating suggestions
  // This way suggestions only appear during natural conversation pauses
  suggestionTimeout = setTimeout(async () => {
    const transcriptText = getTranscriptText().trim();
    
    // Don't request if transcript is empty or unchanged
    if (!transcriptText || transcriptText === lastSuggestionText) {
      return;
    }

    // Only use the last few sentences for context (last ~500 chars)
    const context = transcriptText.slice(-500);
    lastSuggestionText = transcriptText;

    try {
      // Update UI to show we're generating
      els.bestReply.textContent = "Generating suggestions…";
      els.alternate1.textContent = "—";
      els.alternate2.textContent = "—";
      if (els.nextQuestion) els.nextQuestion.textContent = "Generating…";

      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: context }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Failed to generate suggestions");
      }

      const data = await response.json();

      // Update UI with suggestions
      els.bestReply.textContent = data.bestReply || "—";
      els.alternate1.textContent = data.alternate1 || "—";
      els.alternate2.textContent = data.alternate2 || "—";
      if (els.nextQuestion) els.nextQuestion.textContent = data.nextQuestion || "—";

      logDebug("Suggestions generated");
    } catch (err) {
      console.error("Suggestion generation error:", err);
      els.bestReply.textContent = "Error generating suggestions";
      els.alternate1.textContent = "—";
      els.alternate2.textContent = "—";
      if (els.nextQuestion) els.nextQuestion.textContent = "Error";
      logDebug(`Suggestion error: ${err.message}`);
    }
  }, 10000); // Wait 10 seconds after last transcript update (natural pause)
}

// Manual trigger for suggestions (user can click button when they want suggestions)
async function generateSuggestionsNow() {
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
    suggestionTimeout = null;
  }
  
  const transcriptText = getTranscriptText().trim();
  if (!transcriptText) {
    return;
  }
  
  const context = transcriptText.slice(-500);
  lastSuggestionText = transcriptText;

  try {
    els.bestReply.textContent = "Generating suggestions…";
    els.alternate1.textContent = "—";
    els.alternate2.textContent = "—";
    if (els.nextQuestion) els.nextQuestion.textContent = "Generating…";

    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript: context }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate suggestions");
    }

    const data = await response.json();
    els.bestReply.textContent = data.bestReply || "—";
    els.alternate1.textContent = data.alternate1 || "—";
    els.alternate2.textContent = data.alternate2 || "—";
    if (els.nextQuestion) els.nextQuestion.textContent = data.nextQuestion || "—";
    
    logDebug("Suggestions generated manually");
  } catch (err) {
    console.error("Suggestion generation error:", err);
    els.bestReply.textContent = "Error generating suggestions";
  }
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Handle OpenAI Realtime API transcription events
function handleRealtimeEvent(evt) {
  if (!evt || typeof evt !== "object") return;

  const type = String(evt.type || "");
  
  // Log event type for debugging (but not every event to reduce noise)
  if (type && (type.includes("transcript") || type.includes("conversation"))) {
    logDebug(type);
  }

  // Handle conversation.item.input_audio_transcription.completed events
  // This is the main event type for completed transcription segments
  if (type === "conversation.item.input_audio_transcription.completed") {
    const item = evt.item;
    if (item && item.content) {
      // Find the transcript content in the item
      for (const content of item.content) {
        if (content.type === "input_audio_transcription" && content.transcript) {
          const transcript = content.transcript.trim();
          if (transcript) {
            appendTranscriptLine(transcript);
            return;
          }
        }
        // Also check for text field
        if (content.text && typeof content.text === "string") {
          const transcript = content.text.trim();
          if (transcript) {
            appendTranscriptLine(transcript);
            return;
          }
        }
      }
    }
    // Fallback: check for transcript at top level of item
    if (item?.transcript && typeof item.transcript === "string") {
      appendTranscriptLine(item.transcript.trim());
      return;
    }
  }

  // Handle incremental transcript deltas (if any)
  if (type.includes("transcript") && typeof evt.delta === "string" && evt.delta.trim()) {
    appendTranscript(evt.delta);
    return;
  }

  // Handle other transcript event shapes
  if (type.includes("transcript")) {
    const transcript = evt.transcript || evt.text;
    if (typeof transcript === "string" && transcript.trim()) {
      appendTranscriptLine(transcript.trim());
      return;
    }
  }

  // Handle nested content structures
  if (evt?.item?.content) {
    for (const content of evt.item.content) {
      if (content.type?.includes("transcript") || content.type?.includes("input_audio_transcription")) {
        const transcript = content.transcript || content.text;
        if (typeof transcript === "string" && transcript.trim()) {
          appendTranscriptLine(transcript.trim());
          return;
        }
      }
    }
  }
}

async function start() {
  els.startBtn.disabled = true;
  setStatus("Select tab to capture…", false);
  
  // Clear previous transcript
  transcriptMessages = [];
  if (els.transcriptChat) {
    renderTranscriptChat();
  }
  if (els.transcript) {
    els.transcript.value = "";
  }
  currentSpeaker = "client"; // Default to client (tab audio)
  updateAnalysisButtons(); // Disable buttons when clearing

  try {
    // 1) Capture tab audio using getDisplayMedia
    // User must pick the Meet/YouTube tab and check "Share tab audio"
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,   // required by browser UI for tab selection
      audio: true    // this is what we actually want
    });

    // Check if we got audio
    const audioTracks = displayStream.getAudioTracks();
    if (!audioTracks.length) {
      alert(
        "No audio track captured.\n\n" +
        "In Chrome, you must:\n" +
        "1. Pick a TAB (not 'Entire Screen')\n" +
        "2. Enable 'Share tab audio' checkbox\n\n" +
        "Please try again."
      );
      els.startBtn.disabled = false;
      setStatus("No audio captured", false);
      // Stop the video track if we got one
      displayStream.getVideoTracks().forEach(track => track.stop());
      return;
    }

    // Create audio-only stream for transcription
    const audioOnlyStream = new MediaStream([audioTracks[0]]);
    
    // Monitor audio locally (muted to prevent echo/feedback loop)
    // We don't want to play audio that's being captured - it creates echo!
    els.audioMonitor.srcObject = audioOnlyStream;
    els.audioMonitor.volume = 0; // Mute to prevent echo
    els.audioMonitor.muted = true; // Double-mute to be safe
    
    logDebug(`Captured audio track: ${audioTracks[0].label}`);
    setStatus("Audio captured, connecting…", false);

    // Handle when user stops sharing (stop video track)
    displayStream.getVideoTracks()[0].onended = () => {
      logDebug("User stopped screen share");
      stop();
    };

    // Handle when audio track ends
    audioTracks[0].onended = () => {
      logDebug("Audio track ended");
      stop();
    };

    localStream = audioOnlyStream;

    // 2) Get ephemeral session secret from our server
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

    // 3) Create PeerConnection + DataChannel (events)
    pc = new RTCPeerConnection();
    dc = pc.createDataChannel("oai-events");

    dc.onopen = () => {
      setStatus("Connected (transcribing)…", true);
      els.stopBtn.disabled = false;
      if (els.getSuggestionsBtn) els.getSuggestionsBtn.disabled = false;

      // Configure transcription-only behavior with gpt-4o-transcribe and server VAD
      const msg = {
        type: "session.update",
        session: {
          modalities: ["text"],
          instructions:
            "You are a realtime transcription engine. Only output transcription events. Do not generate replies.",
          input_audio_transcription: {
            model: "gpt-4o-transcribe",
          },
          turn_detection: {
            type: "server_vad",
            // Server VAD will automatically detect speech turns
            // Defaults are reasonable: threshold ~0.5, prefix_padding_ms ~300, silence_duration_ms ~800
          },
        },
      };
      dc.send(JSON.stringify(msg));
      logDebug("Sent session.update (transcription-only + server_vad + gpt-4o-transcribe)");
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

    // 4) Add audio track to PeerConnection
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }

    setStatus("Connecting to OpenAI…", false);

    // 5) WebRTC SDP exchange with OpenAI Realtime
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

  } catch (err) {
    els.startBtn.disabled = false;
    setStatus(`Error: ${err.message}`, false);
    logDebug(`Start failed: ${String(err?.message || err)}`);
    
    // Clean up on error
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (els.audioMonitor.srcObject) {
      els.audioMonitor.srcObject = null;
    }
  }
}

async function stop() {
  els.stopBtn.disabled = true;
  setStatus("Stopping…", false);

  // Clear suggestion timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
    suggestionTimeout = null;
  }

  try {
    dc?.close();
  } catch {}
  dc = null;

  try {
    pc?.close();
  } catch {}
  pc = null;

  try {
    if (localStream) {
      for (const track of localStream.getTracks()) {
        track.stop();
      }
    }
  } catch {}
  localStream = null;

  // Clear audio monitor
  if (els.audioMonitor.srcObject) {
    els.audioMonitor.srcObject = null;
  }

  // Reset suggestions
  els.bestReply.textContent = "Click 'Get Suggestions' when you want reply options";
  els.alternate1.textContent = "—";
  els.alternate2.textContent = "—";
  if (els.nextQuestion) els.nextQuestion.textContent = "Click 'Get Suggestions' when you want reply options";
  lastSuggestionText = "";

  // Disable suggestions button (requires active connection)
  if (els.getSuggestionsBtn) {
    els.getSuggestionsBtn.disabled = true;
  }

  // Analysis buttons should remain enabled if transcript exists (works offline)
  updateAnalysisButtons();

  setStatus("Idle", false);
  els.startBtn.disabled = false;
}

// Session Management
function showSessionModal() {
  if (els.sessionModal) {
    els.sessionModal.classList.add("active");
  }
}

function hideSessionModal() {
  if (els.sessionModal) {
    els.sessionModal.classList.remove("active");
  }
}

function initSession(sessionData) {
  currentSession = {
    name: sessionData.name,
    candidateName: sessionData.candidateName,
    role: sessionData.role,
    coachingType: sessionData.coachingType,
    coachingAgenda: sessionData.coachingAgenda,
    contextFileNames: sessionData.contextFileNames || [],
    startTime: new Date().toISOString(),
    transcript: "",
    segments: [],
    analyzedSegments: [],
  };
  
  // Reset notebook and transcript for new session
  analysisNotebook = [];
  transcriptMessages = [];
  currentSpeaker = "client"; // Default to client (tab audio)
  
  // Clear transcript UI
  if (els.transcriptChat) {
    renderTranscriptChat();
  }
  if (els.transcript) {
    els.transcript.value = "";
  }
  
  if (els.sessionInfo) {
    els.sessionInfo.textContent = `${currentSession.name}`;
  }
  
  // Update export button
  updateExportButton();
  
  // Save session
  saveSession();
  
  hideSessionModal();
  // Now start audio capture
  start().catch((err) => {
    logDebug(`Start failed: ${String(err?.message || err)}`);
    stop();
  });
}

// Auto-generate session name
function autoGenerateSessionName(candidateName, role, coachingType) {
  const typeLabels = {
    "system-design": "System Design",
    "behavioral": "Behavioral",
    "technical": "Technical",
    "leadership": "Leadership",
    "communication": "Communication",
    "other": "Coaching"
  };
  
  const typeLabel = typeLabels[coachingType] || "Coaching";
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  return `${typeLabel} - ${candidateName || "Session"} | ${role || ""} | ${date}`.trim();
}

// Parse email to extract session details
function parseEmail(emailText) {
  const extracted = {
    candidateName: "",
    role: "",
    coachingType: "",
    coachingAgenda: "",
  };
  
  if (!emailText || !emailText.trim()) return extracted;
  
  const text = emailText.toLowerCase();
  
  // Extract candidate name (look for patterns like "Bruno / Rupesh" or first name after "This is to confirm that session")
  const nameMatch = emailText.match(/([A-Z][a-z]+)\s*\/\s*([A-Z][a-z]+)/);
  if (nameMatch) {
    extracted.candidateName = nameMatch[1].trim(); // First name before "/"
  }
  
  // Extract role from "What role are you interviewing for?"
  const roleMatch = emailText.match(/\[What role are you interviewing for\?\]\s*\n?\s*([^\[]+)/i);
  if (roleMatch) {
    extracted.role = roleMatch[1].trim();
  }
  
  // Extract coaching type based on interview question type
  const questionTypeMatch = emailText.match(/\[What's the primary type of interview question[^\]]*\]\s*\n?\s*([^\[]+)/i);
  if (questionTypeMatch) {
    const questionType = questionTypeMatch[1].trim().toLowerCase();
    if (questionType.includes("system design") || questionType.includes("hpc cluster") || questionType.includes("infrastructure")) {
      extracted.coachingType = "system-design";
    } else if (questionType.includes("behavioral") || questionType.includes("behavior")) {
      extracted.coachingType = "behavioral";
    } else if (questionType.includes("coding") || questionType.includes("technical") || questionType.includes("algorithm")) {
      extracted.coachingType = "technical";
    } else {
      extracted.coachingType = "technical"; // Default to technical for HPC/infrastructure
    }
  }
  
  // Extract notes/agenda from "Do you have additional notes for this session?"
  const notesMatch = emailText.match(/\[Do you have additional notes[^\]]*\]\s*\n?\s*([^\[]+)/i);
  if (notesMatch) {
    extracted.coachingAgenda = notesMatch[1].trim();
  }
  
  // Also extract companies and interview dates for context
  const companiesMatch = emailText.match(/\[What companies are you interviewing with\?\]\s*\n?\s*([^\[]+)/i);
  const datesMatch = emailText.match(/\[When's your next interview[^\]]*\]\s*\n?\s*([^\[]+)/i);
  
  let agendaParts = [];
  if (extracted.coachingAgenda) {
    agendaParts.push(extracted.coachingAgenda);
  }
  if (companiesMatch) {
    agendaParts.push(`Companies: ${companiesMatch[1].trim()}`);
  }
  if (datesMatch) {
    agendaParts.push(`Interview Dates: ${datesMatch[1].trim()}`);
  }
  
  if (agendaParts.length > 0) {
    extracted.coachingAgenda = agendaParts.join("\n\n");
  }
  
  return extracted;
}

// Session form handler
if (els.sessionForm) {
  // Auto-generate session name when fields change
  const candidateNameEl = document.getElementById("candidateName");
  const candidateRoleEl = document.getElementById("candidateRole");
  const coachingTypeEl = document.getElementById("coachingType");
  const sessionNameEl = document.getElementById("sessionName");
  const emailPasteEl = document.getElementById("emailPaste");
  const parseEmailBtn = document.getElementById("parseEmailBtn");
  const coachingAgendaEl = document.getElementById("coachingAgenda");
  
  // Parse email button
  if (parseEmailBtn && emailPasteEl) {
    parseEmailBtn.addEventListener("click", () => {
      const emailText = emailPasteEl.value.trim();
      if (!emailText) {
        alert("Please paste the booking email first");
        return;
      }
      
      const parsed = parseEmail(emailText);
      
      // Fill in form fields
      if (parsed.candidateName && candidateNameEl) {
        candidateNameEl.value = parsed.candidateName;
        candidateNameEl.dispatchEvent(new Event("input"));
      }
      
      if (parsed.role && candidateRoleEl) {
        candidateRoleEl.value = parsed.role;
        candidateRoleEl.dispatchEvent(new Event("input"));
      }
      
      if (parsed.coachingType && coachingTypeEl) {
        coachingTypeEl.value = parsed.coachingType;
        coachingTypeEl.dispatchEvent(new Event("input"));
      }
      
      if (parsed.coachingAgenda && coachingAgendaEl) {
        coachingAgendaEl.value = parsed.coachingAgenda;
      }
      
      // Auto-select materials based on parsed data
      autoSelectMaterials(parsed.role, parsed.coachingType, parsed.coachingAgenda);
      
      alert("Email parsed! Materials auto-selected. Please review and adjust the fields as needed.");
    });
  }
  
  // Materials library upload
  const materialsUploadEl = document.getElementById("materialsUpload");
  if (materialsUploadEl) {
    materialsUploadEl.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadMaterials(files);
        e.target.value = ""; // Reset input
      }
    });
  }
  
  // Initial render of selected materials
  renderSelectedMaterials();
  
  [candidateNameEl, candidateRoleEl, coachingTypeEl].forEach(el => {
    if (el) {
      el.addEventListener("input", () => {
        if (sessionNameEl && candidateNameEl && candidateRoleEl && coachingTypeEl) {
          if (!sessionNameEl.value || sessionNameEl.dataset.autoGenerated === "true") {
            sessionNameEl.value = autoGenerateSessionName(
              candidateNameEl.value,
              candidateRoleEl.value,
              coachingTypeEl.value
            );
            sessionNameEl.dataset.autoGenerated = "true";
          }
        }
      });
    }
  });
  
  els.sessionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const candidateName = candidateNameEl.value.trim();
    const role = candidateRoleEl.value.trim();
    const coachingType = coachingTypeEl.value;
    const sessionName = sessionNameEl.value.trim() || autoGenerateSessionName(candidateName, role, coachingType);
    const coachingAgenda = document.getElementById("coachingAgenda")?.value.trim() || "";
    const contextFiles = document.getElementById("contextFiles")?.files || [];
    const candidateImage = document.getElementById("candidateImage")?.files[0] || null;
    const mentorImage = document.getElementById("mentorImage")?.files[0] || null;
    
    if (!candidateName || !role || !coachingType) {
      alert("Please fill in Candidate Name, Role, and Coaching Type");
      return;
    }
    
    // Use selected materials from library (not file input)
    const selectedMaterialNames = selectedMaterials
      .map(id => {
        const material = materialsLibrary.find(m => (m.id || m.name) === id);
        return material ? material.name : null;
      })
      .filter(Boolean);
    
    const sessionData = {
      name: sessionName,
      candidateName,
      role,
      coachingType,
      coachingAgenda,
      contextFileNames: selectedMaterialNames, // Use selected materials
      selectedMaterialIds: selectedMaterials,
      candidateImage: candidateImage ? candidateImage.name : null,
      mentorImage: mentorImage ? mentorImage.name : null,
    };
    
    initSession(sessionData);
  });
}

if (els.cancelSessionBtn) {
  els.cancelSessionBtn.addEventListener("click", () => {
    hideSessionModal();
  });
}

// Show modal when Start is clicked
els.startBtn.addEventListener("click", () => {
  if (!currentSession) {
    showSessionModal();
  } else {
    start().catch((err) => {
      logDebug(`Start failed: ${String(err?.message || err)}`);
      stop();
    });
  }
});

els.stopBtn.addEventListener("click", () => {
  stop();
});

// Update analysis buttons based on transcript availability
function updateAnalysisButtons() {
  const hasTranscript = transcriptMessages.length > 0 || (els.transcript && els.transcript.value.trim().length > 0);
  const buttons = [
    els.followupBtn,
    els.revisedStoryBtn,
    els.feedbackSummaryBtn,
    els.interviewPrepBtn,
    els.conversationAnalysisBtn,
  ];
  buttons.forEach(btn => {
    if (btn) btn.disabled = !hasTranscript;
  });
}

// Get transcript text (for analysis)
function getTranscriptText() {
  if (transcriptMessages.length > 0) {
    return transcriptMessages.map(msg => {
      const speaker = msg.speaker === "coach" ? "Coach" : "Client";
      return `${speaker}: ${msg.text}`;
    }).join("\n");
  }
  return els.transcript ? els.transcript.value : "";
}

// Analysis functions
async function runAnalysis(type, endpoint) {
  const transcript = getTranscriptText().trim();
  if (!transcript) {
    alert("Please add transcript text first");
    return;
  }

  // Show loading indicator (but keep previous results)
  const loadingId = `loading-${Date.now()}`;
  if (els.analysisResults) {
    const placeholder = els.analysisResults.querySelector(".analysis-results__placeholder");
    if (placeholder) {
      placeholder.innerHTML = `<div class="analysis-results__loading">Generating ${type}…</div>`;
    } else {
      // Add loading to notebook
      const loadingSection = document.createElement("div");
      loadingSection.className = "notebook-section";
      loadingSection.id = loadingId;
      loadingSection.innerHTML = `<div class="analysis-results__loading">Generating ${type}…</div>`;
      els.analysisResults.insertBefore(loadingSection, els.analysisResults.firstChild);
    }
  }

  try {
    const response = await fetch(`/api/analysis/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error("Analysis failed");
    }

    const data = await response.json();
    
    // Remove loading indicator
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    
    displayAnalysisResults(type, data.result);
  } catch (err) {
    // Remove loading indicator
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    
    // Show error (simplified - could add to notebook array if needed)
    alert(`Error generating ${type}: ${err.message}`);
    console.error("Analysis error:", err);
    
    // Re-render notebook to restore previous results
    renderAnalysisNotebook();
  }
}

// Format analysis result as HTML (for notebook)
function formatAnalysisResult(type, result) {
  let content = "";

  if (type === "Follow-up Questions") {
    const questions = Array.isArray(result) ? result : result.followupQuestions || [];
    content += "<ul class='analysis-list'>";
    questions.forEach(q => {
      content += `<li>${q}</li>`;
    });
    content += "</ul>";
  } else if (type === "Revised Story") {
    content += `<div class="analysis-section"><h4>Original Summary:</h4><p>${escapeHtml(result.originalSummary || "—")}</p></div>`;
    content += `<div class="analysis-section"><h4>Revised Story:</h4><p>${escapeHtml(result.revisedStory || "—")}</p></div>`;
    if (result.improvements) {
      content += "<div class='analysis-section'><h4>Improvements:</h4><ul class='analysis-list'>";
      (Array.isArray(result.improvements) ? result.improvements : []).forEach(imp => {
        content += `<li>${escapeHtml(imp)}</li>`;
      });
      content += "</ul></div>";
    }
  } else if (type === "Feedback Summary") {
    if (result.strengths) {
      content += "<div class='analysis-section'><h4>Strengths:</h4><ul class='analysis-list'>";
      (Array.isArray(result.strengths) ? result.strengths : []).forEach(s => {
        content += `<li>${escapeHtml(s)}</li>`;
      });
      content += "</ul></div>";
    }
    if (result.weaknesses) {
      content += "<div class='analysis-section'><h4>Weaknesses:</h4><ul class='analysis-list'>";
      (Array.isArray(result.weaknesses) ? result.weaknesses : []).forEach(w => {
        content += `<li>${escapeHtml(w)}</li>`;
      });
      content += "</ul></div>";
    }
    if (result.notGood) {
      content += "<div class='analysis-section'><h4>What Was Not Good:</h4><ul class='analysis-list'>";
      (Array.isArray(result.notGood) ? result.notGood : []).forEach(ng => {
        content += `<li>${escapeHtml(ng)}</li>`;
      });
      content += "</ul></div>";
    }
    if (result.improvements) {
      content += "<div class='analysis-section'><h4>How to Improve:</h4><ul class='analysis-list'>";
      (Array.isArray(result.improvements) ? result.improvements : []).forEach(imp => {
        content += `<li>${escapeHtml(imp)}</li>`;
      });
      content += "</ul></div>";
    }
  } else if (type === "Interview Prep") {
    if (result.starMethodFeedback) {
      content += `<div class="analysis-section"><h4>STAR Method Feedback:</h4><p>${escapeHtml(result.starMethodFeedback)}</p></div>`;
    }
    if (result.impactStatements) {
      content += "<div class='analysis-section'><h4>Impact Statements:</h4><ul class='analysis-list'>";
      (Array.isArray(result.impactStatements) ? result.impactStatements : []).forEach(is => {
        content += `<li>${escapeHtml(is)}</li>`;
      });
      content += "</ul></div>";
    }
    if (result.roleSpecificTips) {
      content += "<div class='analysis-section'><h4>Role-Specific Tips:</h4><ul class='analysis-list'>";
      (Array.isArray(result.roleSpecificTips) ? result.roleSpecificTips : []).forEach(tip => {
        content += `<li>${escapeHtml(tip)}</li>`;
      });
      content += "</ul></div>";
    }
    if (result.raiseTheBar) {
      content += `<div class="analysis-section"><h4>Raise the Bar:</h4><p>${escapeHtml(result.raiseTheBar)}</p></div>`;
    }
  } else if (type === "Full Analysis") {
    content += `<div class="analysis-section"><pre class="analysis-json">${JSON.stringify(result, null, 2)}</pre></div>`;
  }

  return content;
}

function escapeHtml(text) {
  if (typeof text !== "string") return text;
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Display analysis results in notebook (accumulate, don't replace)
function displayAnalysisResults(type, result) {
  if (!els.analysisResults) return;

  // Add to notebook array
  const timestamp = new Date().toLocaleTimeString();
  analysisNotebook.push({
    type,
    result,
    timestamp,
    content: formatAnalysisResult(type, result),
  });

  // Render all notebook entries
  renderAnalysisNotebook();
  
  // Auto-save session
  if (currentSession) {
    autoSaveSession();
  }
}

function renderAnalysisNotebook() {
  if (!els.analysisResults) return;

  if (analysisNotebook.length === 0) {
    els.analysisResults.innerHTML = '<div class="analysis-results__placeholder">Click analysis buttons above. All results will be saved here.</div>';
    return;
  }

  let html = '<div class="analysis-notebook">';
  // Render newest first
  analysisNotebook.slice().reverse().forEach((entry, idx) => {
    html += `
      <div class="notebook-section">
        <div class="notebook-section__header">
          <h3 class="notebook-section__title">${entry.type}</h3>
          <span class="notebook-section__timestamp">${entry.timestamp}</span>
        </div>
        <div class="analysis-results__content">
          ${entry.content}
        </div>
      </div>
    `;
  });
  html += "</div>";
  els.analysisResults.innerHTML = html;
  
  // Scroll to top to see latest
  els.analysisResults.scrollTop = 0;
}

// Event listeners
if (els.getSuggestionsBtn) {
  els.getSuggestionsBtn.addEventListener("click", () => {
    generateSuggestionsNow();
  });
}

if (els.followupBtn) {
  els.followupBtn.addEventListener("click", () => runAnalysis("Follow-up Questions", "followup"));
}
if (els.revisedStoryBtn) {
  els.revisedStoryBtn.addEventListener("click", () => runAnalysis("Revised Story", "revised-story"));
}
if (els.feedbackSummaryBtn) {
  els.feedbackSummaryBtn.addEventListener("click", () => runAnalysis("Feedback Summary", "feedback-summary"));
}
if (els.interviewPrepBtn) {
  els.interviewPrepBtn.addEventListener("click", () => runAnalysis("Interview Prep", "interview-prep"));
}
if (els.conversationAnalysisBtn) {
  els.conversationAnalysisBtn.addEventListener("click", () => runAnalysis("Full Analysis", "full"));
}

// Check transcript on input to enable/disable buttons and auto-save
if (els.transcript) {
  els.transcript.addEventListener("input", () => {
    updateAnalysisButtons();
    if (currentSession) {
      autoSaveSession();
    }
  });
}

// ============================================================================
// Session Persistence (localStorage + JSON Export/Import)
// ============================================================================

// Save current session to localStorage (auto-save)
function saveSession() {
  if (!currentSession) return;
  
  try {
    const sessionData = {
      ...currentSession,
      transcript: getTranscriptText(), // Use WhatsApp-style transcript
      transcriptMessages: transcriptMessages, // Save message array
      analysisNotebook: analysisNotebook,
      updatedAt: new Date().toISOString(),
    };
    
    // Save to localStorage with session ID
    const sessionId = currentSession.startTime || Date.now().toString();
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    
    // Also save as current session
    localStorage.setItem("currentSession", JSON.stringify(sessionData));
    
    // Save session metadata to list
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    const existingIndex = sessions.findIndex(s => s.id === sessionId);
    const sessionMeta = {
      id: sessionId,
      name: currentSession.name,
      candidateName: currentSession.candidateName,
      role: currentSession.role,
      coachingType: currentSession.coachingType,
      startTime: currentSession.startTime,
      updatedAt: sessionData.updatedAt,
    };
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionMeta;
    } else {
      sessions.unshift(sessionMeta);
    }
    
    // Keep only last 50 sessions
    localStorage.setItem("sessions", JSON.stringify(sessions.slice(0, 50)));
    
    console.log("Session saved:", sessionId);
  } catch (e) {
    console.warn("Could not save session:", e);
  }
}

// Debounced auto-save
function autoSaveSession() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSession();
  }, 2000); // Save 2 seconds after last change
}

// Export session as JSON file
async function exportSession() {
  if (!currentSession) {
    alert("No active session to export");
    return;
  }
  
  try {
    const sessionData = {
      ...currentSession,
      transcript: getTranscriptText(),
      transcriptMessages: transcriptMessages,
      analysisNotebook: analysisNotebook,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `coaching-session-${currentSession.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("Session exported successfully!");
  } catch (e) {
    console.error("Export error:", e);
    alert("Failed to export session: " + e.message);
  }
}

// Import session from JSON file
async function importSession(file) {
  try {
    const text = await file.text();
    const sessionData = JSON.parse(text);
    
    // Validate session data
    if (!sessionData.name || !sessionData.startTime) {
      throw new Error("Invalid session file format");
    }
    
    // Load session
    currentSession = {
      name: sessionData.name,
      candidateName: sessionData.candidateName || "",
      role: sessionData.role || "",
      coachingType: sessionData.coachingType || "",
      coachingAgenda: sessionData.coachingAgenda || "",
      contextFileNames: sessionData.contextFileNames || [],
      startTime: sessionData.startTime,
      transcript: sessionData.transcript || "",
      segments: sessionData.segments || [],
      analyzedSegments: sessionData.analyzedSegments || [],
    };
    
    analysisNotebook = sessionData.analysisNotebook || [];
    transcriptMessages = sessionData.transcriptMessages || [];
    
    // Update UI
    if (els.transcript) {
      els.transcript.value = currentSession.transcript || "";
    }
    renderTranscriptChat();
    
    if (els.sessionInfo) {
      els.sessionInfo.textContent = currentSession.name;
    }
    
    updateAnalysisButtons();
    renderAnalysisNotebook();
    
    // Save to localStorage
    saveSession();
    
    alert(`Session "${sessionData.name}" imported successfully!`);
  } catch (e) {
    console.error("Import error:", e);
    alert("Failed to import session: " + e.message);
  }
}

// Hook up export/import buttons
if (els.exportSessionBtn) {
  els.exportSessionBtn.addEventListener("click", exportSession);
}

if (els.importSessionBtn) {
  els.importSessionBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        importSession(file);
      }
    };
    input.click();
  });
}

// Update export button state
function updateExportButton() {
  if (els.exportSessionBtn) {
    els.exportSessionBtn.disabled = !currentSession;
  }
  if (els.saveToDriveBtn) {
    els.saveToDriveBtn.disabled = !currentSession || transcriptMessages.length === 0;
  }
}

// Save to Google Drive
async function saveToGoogleDrive() {
  if (!currentSession || transcriptMessages.length === 0) {
    alert("No session or transcript to save");
    return;
  }
  
  try {
    // Prepare session data
    const sessionData = {
      ...currentSession,
      transcript: getTranscriptText(),
      transcriptMessages: transcriptMessages,
      analysisNotebook: analysisNotebook,
      exportedAt: new Date().toISOString(),
    };
    
    // Get OAuth token from user (simplified - in production, use proper OAuth flow)
    const accessToken = await getGoogleAccessToken();
    
    if (!accessToken) {
      // Show instructions for manual setup
      alert(`To save to Google Drive:\n\n1. Go to Google Cloud Console\n2. Create OAuth credentials\n3. Authorize the app\n4. Get access token\n\nFor now, use the Export button to save as JSON.`);
      return;
    }
    
    // Show loading
    els.saveToDriveBtn.disabled = true;
    els.saveToDriveBtn.textContent = "Saving...";
    
    // Call backend to save to Drive
    const response = await fetch("/api/save-to-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionData, accessToken }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      alert(`Session saved to Google Drive!\n\nDocument: ${data.url}\n\nClick OK to open in a new tab.`);
      window.open(data.url, "_blank");
    } else {
      throw new Error(data.error || "Failed to save to Google Drive");
    }
  } catch (err) {
    console.error("Google Drive save error:", err);
    alert(`Failed to save to Google Drive: ${err.message}\n\nUse the Export button to save as JSON file instead.`);
  } finally {
    els.saveToDriveBtn.disabled = false;
    els.saveToDriveBtn.textContent = "📄 Save to Drive";
  }
}

// Get Google OAuth access token (simplified - prompts user)
// In production, implement proper OAuth 2.0 flow with redirect
async function getGoogleAccessToken() {
  // Check if token is stored
  const storedToken = localStorage.getItem("googleDriveToken");
  if (storedToken) {
    // TODO: Validate token hasn't expired
    return storedToken;
  }
  
  // Prompt user for token (for development/testing)
  // In production, redirect to Google OAuth
  const token = prompt(
    "Enter Google OAuth Access Token:\n\n" +
    "To get a token:\n" +
    "1. Go to https://developers.google.com/oauthplayground/\n" +
    "2. Select 'Drive API v3' and 'https://www.googleapis.com/auth/drive'\n" +
    "3. Authorize and get access token\n" +
    "4. Paste it here\n\n" +
    "Or click Cancel to use Export button instead."
  );
  
  if (token && token.trim()) {
    localStorage.setItem("googleDriveToken", token.trim());
    return token.trim();
  }
  
  return null;
}

// Hook up save to drive button
if (els.saveToDriveBtn) {
  els.saveToDriveBtn.addEventListener("click", saveToGoogleDrive);
}

// Enable export button when session starts
updateExportButton();

// ============================================================================
// Materials Library Management
// ============================================================================

// Load materials library from localStorage
function loadMaterialsLibrary() {
  try {
    const stored = localStorage.getItem("materialsLibrary");
    if (stored) {
      materialsLibrary = JSON.parse(stored);
      renderMaterialsLibrary();
    }
  } catch (e) {
    console.warn("Could not load materials library:", e);
    materialsLibrary = [];
  }
}

// Save materials library to localStorage
function saveMaterialsLibrary() {
  try {
    localStorage.setItem("materialsLibrary", JSON.stringify(materialsLibrary));
  } catch (e) {
    console.warn("Could not save materials library:", e);
  }
}

// Extract keywords from material (filename, content preview)
function extractKeywords(material) {
  const keywords = [];
  const name = material.name.toLowerCase();
  const content = (material.content || "").toLowerCase();
  
  // Extract keywords from filename
  const nameParts = name.replace(/[^a-z0-9\s]/gi, " ").split(/\s+/);
  keywords.push(...nameParts.filter(p => p.length > 2));
  
  // Extract keywords from content (first 500 chars)
  const contentPreview = content.substring(0, 500);
  const contentWords = contentPreview.split(/\s+/);
  keywords.push(...contentWords.filter(w => w.length > 4));
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Match materials based on session details
function matchMaterials(role, coachingType, agenda) {
  const searchText = `${role} ${coachingType} ${agenda || ""}`.toLowerCase();
  const matches = [];
  
  materialsLibrary.forEach((material, index) => {
    let score = 0;
    const keywords = material.keywords || extractKeywords(material);
    
    // Check keyword matches
    keywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // Check filename matches
    const name = material.name.toLowerCase();
    if (searchText.includes(name.substring(0, name.indexOf(".")))) {
      score += 3;
    }
    
    // Check role matches
    const roleLower = role.toLowerCase();
    if (name.includes(roleLower) || (material.content || "").toLowerCase().includes(roleLower)) {
      score += 2;
    }
    
    // Check coaching type matches
    const typeLower = coachingType.toLowerCase();
    if (name.includes(typeLower) || (material.content || "").toLowerCase().includes(typeLower)) {
      score += 2;
    }
    
    if (score > 0) {
      matches.push({ material, index, score });
    }
  });
  
  // Sort by score and return top matches (max 5)
  return matches.sort((a, b) => b.score - a.score).slice(0, 5).map(m => m.material);
}

// Auto-select materials when parsing email - now uses server-side matching from folder
async function autoSelectMaterials(role, coachingType, agenda) {
  if (!role && !coachingType) return;
  
  try {
    // Call server to match materials from data/Mentoring Materials folder
    const response = await fetch("/api/materials/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, coachingType, agenda }),
    });
    
    if (response.ok) {
      const data = await response.json();
      // Store matched materials (from folder)
      selectedMaterials = data.materials.map(m => m.path || m.name);
      renderSelectedMaterials();
      console.log(`Auto-selected ${data.materials.length} materials from folder`);
    } else {
      // Fallback to local library matching
      const matched = matchMaterials(role, coachingType, agenda);
      selectedMaterials = matched.map(m => m.id || m.name);
      renderSelectedMaterials();
    }
  } catch (err) {
    console.warn("Error matching materials from folder, using local library:", err);
    // Fallback to local library
    const matched = matchMaterials(role, coachingType, agenda);
    selectedMaterials = matched.map(m => m.id || m.name);
    renderSelectedMaterials();
  }
}

// Render selected materials
function renderSelectedMaterials() {
  const container = document.getElementById("selectedMaterials");
  if (!container) return;
  
  if (selectedMaterials.length === 0) {
    container.innerHTML = '<div class="selected-materials__empty">No materials selected. Materials will be auto-selected when you parse an email.</div>';
    return;
  }
  
  let html = "";
  selectedMaterials.forEach(materialId => {
    const material = materialsLibrary.find(m => (m.id || m.name) === materialId);
    if (material) {
      html += `<span class="material-tag">${escapeHtml(material.name)}</span>`;
    }
  });
  
  container.innerHTML = html || '<div class="selected-materials__empty">No matching materials found.</div>';
}

// Render materials library
function renderMaterialsLibrary() {
  const container = document.getElementById("materialsLibrary");
  if (!container) return;
  
  if (materialsLibrary.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #5a6274; font-style: italic;">No materials in library. Upload materials above.</div>';
    return;
  }
  
  let html = "";
  materialsLibrary.forEach((material, index) => {
    const keywords = material.keywords || extractKeywords(material);
    const keywordsStr = keywords.slice(0, 5).join(", ");
    html += `
      <div class="material-item">
        <div class="material-item__info">
          <div class="material-item__name">${escapeHtml(material.name)}</div>
          <div class="material-item__keywords">Keywords: ${keywordsStr}${keywords.length > 5 ? "..." : ""}</div>
        </div>
        <div class="material-item__actions">
          <button class="material-item__delete" onclick="deleteMaterial(${index})">Delete</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Delete material from library
window.deleteMaterial = function(index) {
  if (confirm(`Delete "${materialsLibrary[index].name}"?`)) {
    materialsLibrary.splice(index, 1);
    saveMaterialsLibrary();
    renderMaterialsLibrary();
  }
};

// Upload materials to library
async function uploadMaterials(files) {
  for (const file of Array.from(files)) {
    try {
      const material = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        content: "",
        keywords: [],
      };
      
      // Read file content (for text-based files)
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const text = await file.text();
        material.content = text;
        material.keywords = extractKeywords(material);
      } else if (file.type === "application/pdf") {
        // For PDFs, we'll just store metadata for now
        // Could use PDF.js library to extract text, but keeping it simple
        material.keywords = extractKeywords({ name: file.name, content: "" });
      } else {
        material.keywords = extractKeywords({ name: file.name, content: "" });
      }
      
      materialsLibrary.push(material);
    } catch (e) {
      console.error(`Error processing file ${file.name}:`, e);
      alert(`Error processing ${file.name}: ${e.message}`);
    }
  }
  
  saveMaterialsLibrary();
  renderMaterialsLibrary();
  alert(`Uploaded ${files.length} material(s) to library!`);
}

// Initialize materials library
loadMaterialsLibrary();

// ============================================================================
// Speaker Toggle & WhatsApp-style Transcript
// ============================================================================

// Toggle speaker button (coach/client)
if (els.toggleSpeakerBtn) {
  let isCoachSpeaking = false;
  els.toggleSpeakerBtn.addEventListener("click", () => {
    isCoachSpeaking = !isCoachSpeaking;
    currentSpeaker = isCoachSpeaking ? "coach" : "client";
    els.toggleSpeakerBtn.textContent = isCoachSpeaking ? "✅ I'm Speaking" : "🎤 I'm Speaking";
    els.toggleSpeakerBtn.style.background = isCoachSpeaking ? "#dcf8c6" : "white";
    els.toggleSpeakerBtn.style.borderColor = isCoachSpeaking ? "#25d366" : "#cfd5e6";
  });
}

// Initialize transcript chat
renderTranscriptChat();

// ============================================================================
// Coach Assistant Chat
// ============================================================================

const els_assistant = {
  assistantMessages: document.getElementById("assistantMessages"),
  assistantInput: document.getElementById("assistantInput"),
  assistantSendBtn: document.getElementById("assistantSendBtn"),
};

// Add message to assistant chat
function addAssistantMessage(text, role = "assistant") {
  if (!els_assistant.assistantMessages) return;
  
  const message = {
    id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    role: role, // "user", "assistant", or "system"
    timestamp: new Date(),
  };
  
  assistantMessages.push(message);
  renderAssistantChat();
  
  // Auto-scroll to bottom
  els_assistant.assistantMessages.scrollTop = els_assistant.assistantMessages.scrollHeight;
}

function renderAssistantChat() {
  if (!els_assistant.assistantMessages) return;
  
  let html = "";
  assistantMessages.forEach(msg => {
    const roleClass = `assistant-message--${msg.role}`;
    const loadingClass = msg.loading ? "assistant-message--loading" : "";
    html += `
      <div class="assistant-message ${roleClass} ${loadingClass}">
        <div class="assistant-message__bubble">${escapeHtml(msg.text)}</div>
      </div>
    `;
  });
  
  els_assistant.assistantMessages.innerHTML = html;
  els_assistant.assistantMessages.scrollTop = els_assistant.assistantMessages.scrollHeight;
}

// Handle assistant questions
async function handleAssistantQuestion(question) {
  if (!question || !question.trim()) return;
  
  // Add user message
  addAssistantMessage(question, "user");
  
  // Show loading
  const loadingId = `loading_${Date.now()}`;
  assistantMessages.push({
    id: loadingId,
    text: "Thinking...",
    role: "assistant",
    timestamp: new Date(),
    loading: true,
  });
  renderAssistantChat();
  
  try {
    // Get context from current session and transcript
    const transcript = getTranscriptText();
    const sessionContext = currentSession ? `
Session: ${currentSession.name}
Candidate: ${currentSession.candidateName}
Role: ${currentSession.role}
Type: ${currentSession.coachingType}
Agenda: ${currentSession.coachingAgenda || "N/A"}
` : "";
    
    const context = `${sessionContext}

Current Transcript:
${transcript || "No transcript yet."}

Question: ${question}

Please provide a helpful answer based on the conversation context. Be concise and actionable.`;
    
    // Call backend for assistant response
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context, transcript }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to get assistant response");
    }
    
    const data = await response.json();
    
    // Remove loading, add response
    assistantMessages = assistantMessages.filter(m => m.id !== loadingId);
    addAssistantMessage(data.answer || "I couldn't generate a response. Please try again.", "assistant");
    
  } catch (err) {
    // Remove loading, show error
    assistantMessages = assistantMessages.filter(m => m.id !== loadingId);
    addAssistantMessage(`Error: ${err.message}. You can still ask questions offline using the transcript.`, "assistant");
    console.error("Assistant error:", err);
  }
}

// Initialize assistant chat with welcome message
if (els_assistant.assistantMessages) {
  assistantMessages.push({
    id: "system_welcome",
    text: "Ask me anything about the conversation, candidate, or coaching strategies. I work offline too!",
    role: "system",
    timestamp: new Date(),
  });
  renderAssistantChat();
}

// ============================================================================
// Load Session from Library
// ============================================================================

// Check if we should load a session from the library
document.addEventListener("DOMContentLoaded", () => {
  const loadSessionId = localStorage.getItem("loadSessionId");
  if (loadSessionId) {
    localStorage.removeItem("loadSessionId");
    const sessionData = getSessionDataFromStorage(loadSessionId);
    if (sessionData) {
      importSessionData(sessionData);
    }
  }
});

function getSessionDataFromStorage(sessionId) {
  try {
    const sessionStr = localStorage.getItem(`session_${sessionId}`);
    if (sessionStr) {
      return JSON.parse(sessionStr);
    }
    return null;
  } catch (e) {
    console.error("Error loading session:", e);
    return null;
  }
}

function importSessionData(sessionData) {
  currentSession = {
    name: sessionData.name,
    candidateName: sessionData.candidateName || "",
    role: sessionData.role || "",
    coachingType: sessionData.coachingType || "",
    coachingAgenda: sessionData.coachingAgenda || "",
    startTime: sessionData.startTime,
  };
  
  analysisNotebook = sessionData.analysisNotebook || [];
  transcriptMessages = sessionData.transcriptMessages || [];
  
  // Update UI
  if (els.transcript) {
    els.transcript.value = sessionData.transcript || "";
  }
  renderTranscriptChat();
  
  if (els.sessionInfo) {
    els.sessionInfo.textContent = currentSession.name;
  }
  
  updateAnalysisButtons();
  renderAnalysisNotebook();
  
  alert(`Session "${sessionData.name}" loaded!`);
}

// Hook up assistant input
if (els_assistant.assistantInput && els_assistant.assistantSendBtn) {
  // Enable/disable send button
  els_assistant.assistantInput.addEventListener("input", (e) => {
    els_assistant.assistantSendBtn.disabled = !e.target.value.trim();
  });
  
  // Send on Enter
  els_assistant.assistantInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!els_assistant.assistantSendBtn.disabled) {
        els_assistant.assistantSendBtn.click();
      }
    }
  });
  
  // Send button click
  els_assistant.assistantSendBtn.addEventListener("click", async () => {
    const question = els_assistant.assistantInput.value.trim();
    if (!question) return;
    
    els_assistant.assistantInput.value = "";
    els_assistant.assistantSendBtn.disabled = true;
    
    await handleAssistantQuestion(question);
  });
}
