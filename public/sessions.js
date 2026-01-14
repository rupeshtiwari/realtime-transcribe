// Session Library Management

let allSessions = [];
let filteredSessions = [];

// Load all sessions from localStorage
function loadSessions() {
  try {
    const sessionsStr = localStorage.getItem("sessions");
    allSessions = sessionsStr ? JSON.parse(sessionsStr) : [];
    
    // Also check for individual session_* keys
    const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith("session_"));
    sessionKeys.forEach(key => {
      try {
        const sessionData = JSON.parse(localStorage.getItem(key));
        if (sessionData && sessionData.startTime) {
          const existing = allSessions.find(s => s.id === sessionData.startTime);
          if (!existing) {
            allSessions.push({
              id: sessionData.startTime,
              name: sessionData.name || "Untitled Session",
              candidateName: sessionData.candidateName || "",
              role: sessionData.role || "",
              coachingType: sessionData.coachingType || "",
              startTime: sessionData.startTime,
              updatedAt: sessionData.updatedAt || sessionData.startTime,
            });
          }
        }
      } catch (e) {
        console.warn("Error parsing session:", key, e);
      }
    });
    
    // Sort by updatedAt (newest first)
    allSessions.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.startTime || 0);
      const dateB = new Date(b.updatedAt || b.startTime || 0);
      return dateB - dateA;
    });
    
    filteredSessions = [...allSessions];
    renderSessions();
    updateStats();
  } catch (e) {
    console.error("Error loading sessions:", e);
    allSessions = [];
    filteredSessions = [];
    renderSessions();
  }
}

// Render sessions list
function renderSessions() {
  const container = document.getElementById("sessionsList");
  const noSessions = document.getElementById("noSessions");
  
  if (!container) return;
  
  if (filteredSessions.length === 0) {
    container.style.display = "none";
    if (noSessions) noSessions.style.display = "block";
    return;
  }
  
  container.style.display = "block";
  if (noSessions) noSessions.style.display = "none";
  
  let html = "";
  filteredSessions.forEach(session => {
    const date = new Date(session.updatedAt || session.startTime);
    const dateStr = date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    html += `
      <div class="session-card" data-session-id="${session.id}">
        <div class="session-card__header">
          <h3 class="session-card__title">${escapeHtml(session.name || "Untitled Session")}</h3>
          <span class="session-card__date">${dateStr}</span>
        </div>
        <div class="session-card__body">
          <div class="session-card__meta">
            <span class="session-meta">
              <strong>Candidate:</strong> ${escapeHtml(session.candidateName || "N/A")}
            </span>
            <span class="session-meta">
              <strong>Role:</strong> ${escapeHtml(session.role || "N/A")}
            </span>
            <span class="session-meta">
              <strong>Type:</strong> ${escapeHtml(session.coachingType || "N/A")}
            </span>
          </div>
        </div>
        <div class="session-card__actions">
          <button class="btn btn--small" onclick="viewSession('${session.id}')">View</button>
          <button class="btn btn--small" onclick="loadSession('${session.id}')">Load</button>
          <button class="btn btn--small" onclick="exportSession('${session.id}')">Export</button>
          <button class="btn btn--small btn--danger" onclick="deleteSession('${session.id}')">Delete</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Update stats
function updateStats() {
  const statsEl = document.getElementById("sessionsStats");
  if (!statsEl) return;
  
  const total = allSessions.length;
  const byType = {};
  allSessions.forEach(s => {
    const type = s.coachingType || "Other";
    byType[type] = (byType[type] || 0) + 1;
  });
  
  statsEl.innerHTML = `
    <span class="stat">Total: ${total}</span>
    ${Object.entries(byType).map(([type, count]) => 
      `<span class="stat">${type}: ${count}</span>`
    ).join("")}
  `;
}

// Filter sessions
function filterSessions() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const filterType = document.getElementById("filterType")?.value || "";
  
  filteredSessions = allSessions.filter(session => {
    const matchesSearch = !searchTerm || 
      (session.name || "").toLowerCase().includes(searchTerm) ||
      (session.candidateName || "").toLowerCase().includes(searchTerm) ||
      (session.role || "").toLowerCase().includes(searchTerm);
    
    const matchesType = !filterType || (session.coachingType || "") === filterType;
    
    return matchesSearch && matchesType;
  });
  
  renderSessions();
}

// View session details
function viewSession(sessionId) {
  const sessionData = getSessionData(sessionId);
  if (!sessionData) {
    alert("Session not found");
    return;
  }
  
  const modal = document.getElementById("sessionModal");
  const modalName = document.getElementById("modalSessionName");
  const modalBody = document.getElementById("modalSessionBody");
  
  if (!modal || !modalName || !modalBody) return;
  
  modalName.textContent = sessionData.name || "Untitled Session";
  
  const date = new Date(sessionData.updatedAt || sessionData.startTime);
  const transcript = sessionData.transcript || sessionData.transcriptMessages?.map(m => 
    `${m.speaker === "coach" ? "Coach" : "Client"}: ${m.text}`
  ).join("\n\n") || "No transcript";
  
  const analysisCount = sessionData.analysisNotebook?.length || 0;
  
  modalBody.innerHTML = `
    <div class="session-detail">
      <div class="session-detail__section">
        <h3>Session Information</h3>
        <p><strong>Date:</strong> ${date.toLocaleString()}</p>
        <p><strong>Candidate:</strong> ${escapeHtml(sessionData.candidateName || "N/A")}</p>
        <p><strong>Role:</strong> ${escapeHtml(sessionData.role || "N/A")}</p>
        <p><strong>Type:</strong> ${escapeHtml(sessionData.coachingType || "N/A")}</p>
        <p><strong>Agenda:</strong> ${escapeHtml(sessionData.coachingAgenda || "N/A")}</p>
      </div>
      
      <div class="session-detail__section">
        <h3>Transcript</h3>
        <div class="session-detail__transcript">${escapeHtml(transcript.substring(0, 1000))}${transcript.length > 1000 ? "..." : ""}</div>
        <p><em>${transcript.split("\n").length} lines total</em></p>
      </div>
      
      <div class="session-detail__section">
        <h3>Analysis</h3>
        <p>${analysisCount} analysis entries</p>
      </div>
    </div>
  `;
  
  // Set up buttons
  const loadBtn = document.getElementById("loadSessionBtn");
  const exportBtn = document.getElementById("exportSessionBtn");
  const deleteBtn = document.getElementById("deleteSessionBtn");
  
  if (loadBtn) loadBtn.onclick = () => { loadSession(sessionId); closeSessionModal(); };
  if (exportBtn) exportBtn.onclick = () => { exportSession(sessionId); };
  if (deleteBtn) deleteBtn.onclick = () => { deleteSession(sessionId); closeSessionModal(); };
  
  modal.style.display = "flex";
}

function closeSessionModal() {
  const modal = document.getElementById("sessionModal");
  if (modal) modal.style.display = "none";
}

// Load session (redirect to main page with session)
function loadSession(sessionId) {
  localStorage.setItem("loadSessionId", sessionId);
  window.location.href = "/";
}

// Export session
function exportSession(sessionId) {
  const sessionData = getSessionData(sessionId);
  if (!sessionData) {
    alert("Session not found");
    return;
  }
  
  try {
    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `coaching-session-${(sessionData.name || "untitled").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${sessionId}.json`;
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

// Delete session
function deleteSession(sessionId) {
  if (!confirm("Are you sure you want to delete this session? This cannot be undone.")) {
    return;
  }
  
  try {
    // Remove from sessions list
    allSessions = allSessions.filter(s => s.id !== sessionId);
    localStorage.setItem("sessions", JSON.stringify(allSessions));
    
    // Remove session data
    localStorage.removeItem(`session_${sessionId}`);
    
    // If it's the current session, clear it
    const currentSession = JSON.parse(localStorage.getItem("currentSession") || "null");
    if (currentSession && currentSession.startTime === sessionId) {
      localStorage.removeItem("currentSession");
    }
    
    filterSessions();
    updateStats();
    alert("Session deleted successfully!");
  } catch (e) {
    console.error("Delete error:", e);
    alert("Failed to delete session: " + e.message);
  }
}

// Get full session data
function getSessionData(sessionId) {
  try {
    const sessionStr = localStorage.getItem(`session_${sessionId}`);
    if (sessionStr) {
      return JSON.parse(sessionStr);
    }
    return null;
  } catch (e) {
    console.error("Error getting session data:", e);
    return null;
  }
}

// Import old session txt files
async function importOldSessions() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".txt";
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    let imported = 0;
    let errors = 0;
    
    for (const file of files) {
      try {
        const text = await file.text();
        const sessionData = parseOldSessionFile(file.name, text);
        
        if (sessionData) {
          // Save session
          const sessionId = sessionData.startTime || Date.now().toString();
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
          
          // Add to sessions list
          const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
          const existingIndex = sessions.findIndex(s => s.id === sessionId);
          const sessionMeta = {
            id: sessionId,
            name: sessionData.name,
            candidateName: sessionData.candidateName || "",
            role: sessionData.role || "",
            coachingType: sessionData.coachingType || "",
            startTime: sessionData.startTime,
            updatedAt: sessionData.updatedAt || sessionData.startTime,
          };
          
          if (existingIndex >= 0) {
            sessions[existingIndex] = sessionMeta;
          } else {
            sessions.unshift(sessionMeta);
          }
          
          localStorage.setItem("sessions", JSON.stringify(sessions));
          imported++;
        } else {
          errors++;
        }
      } catch (e) {
        console.error(`Error importing ${file.name}:`, e);
        errors++;
      }
    }
    
    alert(`Imported ${imported} session(s). ${errors > 0 ? `${errors} file(s) failed.` : ""}`);
    loadSessions();
  };
  
  input.click();
}

// Parse old session txt file (ChatGPT export format)
function parseOldSessionFile(filename, text) {
  try {
    // Extract email booking info
    const emailMatch = text.match(/([A-Za-z]+)\s*\/\s*Rupesh\s+Coaching\s+session\s+#(\d+)/i);
    const candidateName = emailMatch ? emailMatch[1] : filename.replace(/\.txt$/, "").split("-")[0];
    
    // Extract role
    const roleMatch = text.match(/\[What role are you interviewing for\?\]\s*\n\s*([^\n]+)/i) ||
                     text.match(/role[:\s]+([^\n]+)/i);
    const role = roleMatch ? roleMatch[1].trim() : "";
    
    // Extract coaching type
    const typeMatch = text.match(/\[What's the primary type of interview question[^\]]+\?\]\s*\n\s*([^\n]+)/i) ||
                     text.match(/\[What stage are you at[^\]]+\?\]\s*\n\s*([^\n]+)/i) ||
                     text.match(/(system design|behavioral|technical|mock interview|resume review)/i);
    const coachingType = typeMatch ? typeMatch[1].trim() : "";
    
    // Extract companies
    const companyMatch = text.match(/\[What companies are you interviewing with\?\]\s*\n\s*([^\n]+)/i);
    const companies = companyMatch ? companyMatch[1].trim() : "";
    
    // Extract session number
    const sessionNumMatch = text.match(/#(\d+)/);
    const sessionNum = sessionNumMatch ? sessionNumMatch[1] : "";
    
    // Create session name
    const sessionName = `${candidateName}${role ? ` - ${role}` : ""}${coachingType ? ` - ${coachingType}` : ""}`.trim() || filename.replace(/\.txt$/, "");
    
    // Extract ChatGPT conversation (everything after "ChatGPT said:")
    const chatStart = text.indexOf("ChatGPT said:");
    const chatContent = chatStart >= 0 ? text.substring(chatStart) : text;
    
    // Create session data
    const sessionData = {
      name: sessionName,
      candidateName: candidateName,
      role: role,
      coachingType: coachingType || "Interview coaching",
      coachingAgenda: companies ? `Companies: ${companies}` : "",
      startTime: Date.now().toString(),
      updatedAt: new Date().toISOString(),
      transcript: chatContent,
      transcriptMessages: [], // Will be empty for old sessions
      analysisNotebook: [],
      importedFrom: filename,
      originalContent: text.substring(0, 5000), // Store first 5000 chars
    };
    
    return sessionData;
  } catch (e) {
    console.error("Error parsing old session file:", e);
    return null;
  }
}

function escapeHtml(text) {
  if (typeof text !== "string") return text;
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadSessions();
  
  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", filterSessions);
  }
  
  // Filter dropdown
  const filterType = document.getElementById("filterType");
  if (filterType) {
    filterType.addEventListener("change", filterSessions);
  }
  
  // Import old sessions button
  const importBtn = document.getElementById("importOldSessionsBtn");
  if (importBtn) {
    importBtn.addEventListener("click", importOldSessions);
  }
  
  // Close modal on outside click
  const modal = document.getElementById("sessionModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeSessionModal();
      }
    });
  }
});

// Make functions available globally
window.viewSession = viewSession;
window.loadSession = loadSession;
window.exportSession = exportSession;
window.deleteSession = deleteSession;
window.closeSessionModal = closeSessionModal;
