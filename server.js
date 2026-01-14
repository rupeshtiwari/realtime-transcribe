require("dotenv").config();
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

const app = express();
app.use(express.json({ limit: "10mb" })); // Increased for file uploads

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REALTIME_MODEL = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
const SUGGESTION_MODEL = process.env.SUGGESTION_MODEL || "gpt-4o-mini";

// Store OpenAI Assistant ID and file IDs (persist in .env or file)
let ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || null;
let OPENAI_FILE_IDS = {}; // Map of file paths to OpenAI file IDs

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ============================================================================
// OpenAI Assistant Setup - Upload Materials Once, Reuse Forever
// ============================================================================

// Initialize Assistant with materials (run once)
async function initializeAssistant() {
  if (ASSISTANT_ID) {
    console.log(`Using existing Assistant ID: ${ASSISTANT_ID}`);
    return ASSISTANT_ID;
  }

  try {
    // Upload all materials to OpenAI (one-time cost)
    const materialsPath = path.join(__dirname, "data", "Mentoring Materials");
    const fileIds = await uploadMaterialsToOpenAI(materialsPath);
    
    // Create Assistant with file attachments (files are embedded/cached)
    const assistantResponse = await fetch("https://api.openai.com/v1/assistants", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        name: "Coach Copilot Assistant",
        instructions: `You are an expert coaching assistant with access to comprehensive mentoring materials including:
- System Design Interview frameworks and rubrics
- Behavioral interview guides and STAR method templates
- Coding interview questions and grading rubrics
- Data Engineering interview frameworks
- TPM interview materials
- Role-specific preparation guides (SA, SDE, DE, TPM, etc.)

Use these materials to provide accurate, context-aware coaching advice. Reference specific frameworks and rubrics when relevant.`,
        model: SUGGESTION_MODEL,
        tools: [{ type: "file_search" }],
        tool_resources: fileIds.length > 0 ? {
          file_search: {
            vector_store_ids: [await createVectorStore(fileIds)],
          },
        } : undefined,
      }),
    });

    if (!assistantResponse.ok) {
      const error = await assistantResponse.json();
      throw new Error(`Failed to create assistant: ${JSON.stringify(error)}`);
    }

    const assistant = await assistantResponse.json();
    ASSISTANT_ID = assistant.id;
    
    // Save to .env or config file
    console.log(`✅ Assistant created: ${ASSISTANT_ID}`);
    console.log(`Add to .env: OPENAI_ASSISTANT_ID=${ASSISTANT_ID}`);
    
    return ASSISTANT_ID;
  } catch (err) {
    console.error("Error initializing assistant:", err);
    return null;
  }
}

// Upload materials to OpenAI (one-time, files are cached)
async function uploadMaterialsToOpenAI(materialsPath) {
  const fileIds = [];
  const supportedExtensions = [".pdf", ".txt", ".md", ".docx"];
  
  async function scanDirectory(dir, relativePath = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relPath);
      } else if (supportedExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
        try {
          const fileId = await uploadFileToOpenAI(fullPath, entry.name);
          if (fileId) {
            fileIds.push(fileId);
            OPENAI_FILE_IDS[relPath] = fileId;
            console.log(`✅ Uploaded: ${relPath} -> ${fileId}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to upload ${relPath}:`, err.message);
        }
      }
    }
  }
  
  await scanDirectory(materialsPath);
  return fileIds;
}

// Upload single file to OpenAI
async function uploadFileToOpenAI(filePath, fileName) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const form = new FormData();
    form.append("file", fileBuffer, {
      filename: fileName,
      contentType: getContentType(fileName),
    });
    form.append("purpose", "assistants");

    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await response.json();
    return data.id;
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err);
    return null;
  }
}

// Create vector store for file search
async function createVectorStore(fileIds) {
  const response = await fetch("https://api.openai.com/v1/vector_stores", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Coaching Materials",
      file_ids: fileIds,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create vector store");
  }

  const data = await response.json();
  return data.id;
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return types[ext] || "application/octet-stream";
}

// Auto-select materials from folder based on session details
app.post("/api/materials/match", async (req, res) => {
  const { role, coachingType, agenda } = req.body;
  
  try {
    const materialsPath = path.join(__dirname, "data", "Mentoring Materials");
    const matchedFiles = await findMatchingMaterials(materialsPath, role, coachingType, agenda);
    
    res.json({ 
      materials: matchedFiles,
      message: `Found ${matchedFiles.length} matching materials`
    });
  } catch (err) {
    console.error("Error matching materials:", err);
    res.status(500).json({ error: err.message });
  }
});

// Find matching materials in folder
async function findMatchingMaterials(materialsPath, role, coachingType, agenda) {
  const matches = [];
  const searchTerms = `${role} ${coachingType} ${agenda || ""}`.toLowerCase();
  
  async function scanDirectory(dir, relativePath = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relPath);
      } else {
        const fileName = entry.name.toLowerCase();
        let score = 0;
        
        // Score based on filename matching
        if (role && fileName.includes(role.toLowerCase())) score += 3;
        if (coachingType && fileName.includes(coachingType.toLowerCase().replace("-", " "))) score += 3;
        if (agenda && fileName.includes(agenda.toLowerCase().substring(0, 20))) score += 2;
        
        // Check folder names
        const folderName = path.dirname(relPath).toLowerCase();
        if (coachingType && folderName.includes(coachingType.toLowerCase().replace("-", " "))) score += 2;
        if (role && folderName.includes(role.toLowerCase())) score += 2;
        
        // Common keywords
        const keywords = {
          "system design": ["system", "design", "architecture", "ifrail"],
          "behavioral": ["behavior", "star", "leadership", "lp"],
          "technical": ["coding", "algorithm", "technical"],
          "data engineering": ["data", "engineering", "pipeline", "etl"],
        };
        
        Object.entries(keywords).forEach(([key, terms]) => {
          if (coachingType && coachingType.toLowerCase().includes(key)) {
            terms.forEach(term => {
              if (fileName.includes(term) || folderName.includes(term)) score += 1;
            });
          }
        });
        
        if (score > 0) {
          matches.push({
            path: relPath,
            name: entry.name,
            score,
            fullPath: fullPath,
          });
        }
      }
    }
  }
  
  await scanDirectory(materialsPath);
  
  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Top 10 matches
    .map(m => ({
      name: m.name,
      path: m.path,
      relativePath: m.path,
    }));
}

// ============================================================================
// Realtime Session
// ============================================================================

app.post("/api/session", async (_req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({
      error: "Missing OPENAI_API_KEY. Set it in your environment (see .env.example).",
    });
    return;
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        modalities: ["text"],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      res.status(resp.status).json({ error: data });
      return;
    }

    const clientSecret =
      data?.client_secret?.value ||
      data?.client_secret ||
      data?.clientSecret ||
      data?.session?.client_secret?.value;

    if (!clientSecret) {
      res.status(500).json({ error: "No client_secret in response", data });
      return;
    }

    res.json({ client_secret: clientSecret });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// ============================================================================
// Analysis Endpoints - Use Assistant API (Cost Optimized)
// ============================================================================

// Generic analysis endpoint using Assistant API
async function runAnalysisWithAssistant(transcript, analysisType, instructions) {
  // Ensure assistant is initialized
  if (!ASSISTANT_ID) {
    ASSISTANT_ID = await initializeAssistant();
    if (!ASSISTANT_ID) {
      throw new Error("Failed to initialize assistant. Please check OpenAI API key and materials folder.");
    }
  }

  // Create a thread
  const threadResponse = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `${instructions}\n\nTranscript:\n\n${transcript}`,
        },
      ],
    }),
  });

  if (!threadResponse.ok) {
    throw new Error("Failed to create thread");
  }

  const thread = await threadResponse.json();

  // Run the assistant
  const runResponse = await fetch(
    `https://api.openai.com/v1/threads/${thread.id}/runs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    }
  );

  if (!runResponse.ok) {
    throw new Error("Failed to run assistant");
  }

  let run = await runResponse.json();

  // Poll for completion
  while (run.status === "queued" || run.status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const statusResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    run = await statusResponse.json();
  }

  if (run.status !== "completed") {
    throw new Error(`Run failed: ${run.status}`);
  }

  // Get messages
  const messagesResponse = await fetch(
    `https://api.openai.com/v1/threads/${thread.id}/messages`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    }
  );

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data
    .filter((m) => m.role === "assistant")
    .pop();

  if (!assistantMessage) {
    throw new Error("No response from assistant");
  }

  const content = assistantMessage.content[0].text.value;
  
  // Try to parse as JSON, otherwise return as text
  try {
    return JSON.parse(content);
  } catch {
    return { result: content };
  }
}

// Analysis endpoints using Assistant API
app.post("/api/analysis/followup", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript required" });
  }

  try {
    const result = await runAnalysisWithAssistant(
      transcript,
      "Follow-up Questions",
      "Analyze the conversation transcript and provide 5-7 strategic follow-up questions the coach should ask. Format as JSON: { followupQuestions: [array of questions] }"
    );
    res.json({ result: result.followupQuestions || result });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/revised-story", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript required" });
  }

  try {
    const result = await runAnalysisWithAssistant(
      transcript,
      "Revised Story",
      "Analyze the conversation and provide a revised version of the candidate's story with improvements. Format as JSON: { originalSummary: string, revisedStory: string, improvements: [array] }"
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/feedback-summary", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript required" });
  }

  try {
    const result = await runAnalysisWithAssistant(
      transcript,
      "Feedback Summary",
      "Analyze the conversation and provide comprehensive feedback. Format as JSON: { strengths: [array], weaknesses: [array], notGood: [array], improvements: [array] }"
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/interview-prep", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript required" });
  }

  try {
    const result = await runAnalysisWithAssistant(
      transcript,
      "Interview Prep",
      "Provide interview preparation feedback. Format as JSON: { starMethodFeedback: string, impactStatements: [array], roleSpecificTips: [array], raiseTheBar: string }"
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/full", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript required" });
  }

  try {
    const result = await runAnalysisWithAssistant(
      transcript,
      "Full Analysis",
      "Provide comprehensive analysis of the conversation covering all aspects: follow-up answers, original story, weaknesses, strengths, improvements, and actionable recommendations. Format as JSON."
    );
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// ============================================================================
// Suggestions & Assistant Chat (Keep using Chat Completions for speed)
// ============================================================================

app.post("/api/suggestions", async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript text is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SUGGESTION_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful coaching assistant. Provide: 1. Best suggested reply, 2. Two alternatives, 3. A follow-up question. Format as JSON: { bestReply, alternate1, alternate2, nextQuestion }",
          },
          {
            role: "user",
            content: `Based on this transcript, provide coaching reply suggestions:\n\n${transcript}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/assistant", async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const { question, context, transcript } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // Use Assistant API if available, otherwise fallback to Chat Completions
    if (ASSISTANT_ID) {
      const result = await runAnalysisWithAssistant(
        transcript || "",
        "Assistant Chat",
        `Answer this question based on the session context and transcript:\n\nContext: ${context || ""}\n\nQuestion: ${question}\n\nBe concise and actionable.`
      );
      return res.json({ answer: result.result || result.answer || JSON.stringify(result) });
    }

    // Fallback to Chat Completions
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SUGGESTION_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a helpful coaching assistant. Answer questions about the coaching session, candidate, conversation, or provide coaching strategies. Be concise, actionable, and helpful. Use the context provided to give relevant answers.`,
          },
          {
            role: "user",
            content: `${context || ""}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error?.message || "Failed to get assistant response");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    res.json({ answer });
  } catch (err) {
    console.error("Assistant error:", err);
    res.status(500).json({ error: err.message || "Failed to process assistant request" });
  }
});

// ============================================================================
// Google Drive API
// ============================================================================

app.post("/api/save-to-drive", async (req, res) => {
  const { sessionData, accessToken } = req.body;
  
  if (!sessionData || !accessToken) {
    return res.status(400).json({
      error: "Session data and access token are required",
      instructions: "To use Google Drive save:\n1. Get OAuth access token from Google\n2. Pass token and session data to this endpoint"
    });
  }
  
  try {
    const { google } = require("googleapis");
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });
    
    const docContent = formatSessionAsDoc(sessionData);
    
    const docResponse = await docs.documents.create({
      requestBody: {
        title: sessionData.name || "Coaching Session",
      },
    });
    
    const documentId = docResponse.data.documentId;
    
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: docContent,
            },
          },
        ],
      },
    });
    
    const docUrl = `https://docs.google.com/document/d/${documentId}`;
    
    res.json({
      success: true,
      documentId: documentId,
      url: docUrl,
      message: "Session saved to Google Drive successfully!"
    });
  } catch (err) {
    console.error("Google Drive error:", err);
    res.status(500).json({
      error: err.message || "Failed to save to Google Drive",
      instructions: "Make sure you have:\n1. Valid OAuth access token\n2. Google Drive API enabled\n3. Proper permissions"
    });
  }
});

function formatSessionAsDoc(sessionData) {
  let content = `${sessionData.name || "Coaching Session"}\n`;
  content += "=".repeat(50) + "\n\n";
  content += `Session Information\n`;
  content += "-".repeat(30) + "\n";
  content += `Candidate: ${sessionData.candidateName || "N/A"}\n`;
  content += `Role: ${sessionData.role || "N/A"}\n`;
  content += `Type: ${sessionData.coachingType || "N/A"}\n`;
  content += `Date: ${new Date(sessionData.startTime || Date.now()).toLocaleString()}\n\n`;
  
  if (sessionData.coachingAgenda) {
    content += `Agenda:\n${sessionData.coachingAgenda}\n\n`;
  }
  
  content += `Transcript\n`;
  content += "-".repeat(30) + "\n";
  
  if (sessionData.transcriptMessages && sessionData.transcriptMessages.length > 0) {
    sessionData.transcriptMessages.forEach(msg => {
      const speaker = msg.speaker === "coach" ? "Coach" : "Client";
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "";
      content += `[${time}] ${speaker}: ${msg.text}\n\n`;
    });
  } else if (sessionData.transcript) {
    content += `${sessionData.transcript}\n\n`;
  } else {
    content += "No transcript available.\n\n";
  }
  
  if (sessionData.analysisNotebook && sessionData.analysisNotebook.length > 0) {
    content += `Analysis Results\n`;
    content += "-".repeat(30) + "\n";
    sessionData.analysisNotebook.forEach((entry, idx) => {
      content += `${idx + 1}. ${entry.type} (${entry.timestamp})\n`;
      if (entry.result) {
        content += `${JSON.stringify(entry.result, null, 2)}\n\n`;
      }
    });
  }
  
  return content;
}

// Initialize assistant on startup (optional - can be done manually)
if (process.env.AUTO_INIT_ASSISTANT === "true") {
  initializeAssistant().catch(console.error);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!ASSISTANT_ID) {
    console.log("\n⚠️  Assistant not initialized. To set up:");
    console.log("1. Set AUTO_INIT_ASSISTANT=true in .env (or call /api/assistant/init)");
    console.log("2. Materials will be uploaded to OpenAI once");
    console.log("3. Assistant will be created with embedded materials");
    console.log("4. Save the ASSISTANT_ID to .env for reuse\n");
  }
});
