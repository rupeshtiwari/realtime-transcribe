require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REALTIME_MODEL = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Creates an ephemeral Realtime session token for the browser (WebRTC).
app.post("/api/session", async (_req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({
      error:
        "Missing OPENAI_API_KEY. Set it in your environment (see .env.example).",
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
        // We only need text events for transcription.
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
      null;

    if (!clientSecret) {
      res.status(500).json({
        error: "Realtime session created but client_secret was missing.",
        raw: data,
      });
      return;
    }

    res.json({
      client_secret: clientSecret,
      realtime_model: REALTIME_MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// YouTube audio extraction endpoint
// Note: This requires yt-dlp to be installed: pip install yt-dlp
// Or use: brew install yt-dlp (on macOS)
app.get("/api/youtube-audio/:videoId", async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    res.status(400).json({ error: "Video ID required" });
    return;
  }

  try {
    // Try to use yt-dlp if available
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    // Get audio stream URL from YouTube using yt-dlp
    const { stdout } = await execAsync(
      `yt-dlp -f "bestaudio[ext=m4a]/best[ext=mp4]/best" -g "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null || echo ""`
    );

    const streamUrl = stdout.trim();
    
    if (!streamUrl) {
      // Fallback: return YouTube embed URL (won't work for CORS but shows structure)
      res.status(501).json({ 
        error: "YouTube audio extraction requires yt-dlp to be installed",
        instructions: "Install with: pip install yt-dlp or brew install yt-dlp",
        fallback: `https://www.youtube.com/embed/${videoId}?autoplay=1`
      });
      return;
    }

    // Proxy the audio stream
    const audioResp = await fetch(streamUrl);
    if (!audioResp.ok) {
      throw new Error(`Failed to fetch audio: ${audioResp.statusText}`);
    }

    res.setHeader("Content-Type", audioResp.headers.get("content-type") || "audio/mp4");
    res.setHeader("Content-Length", audioResp.headers.get("content-length") || "");
    
    // Stream the audio
    const reader = audioResp.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    pump();
  } catch (err) {
    console.error("YouTube audio error:", err);
    res.status(500).json({ 
      error: "Failed to extract YouTube audio",
      message: err.message,
      note: "You may need to install yt-dlp: pip install yt-dlp"
    });
  }
});

// Generate coach reply suggestions from transcript
// This is Stream 2: takes transcript chunks and generates suggested replies
const SUGGESTION_MODEL = process.env.SUGGESTION_MODEL || "gpt-4o-mini";

app.post("/api/suggestions", async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({
      error: "Missing OPENAI_API_KEY. Set it in your environment.",
    });
    return;
  }

  const { transcript } = req.body;

  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    res.status(400).json({ error: "Transcript text is required" });
    return;
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
              "You are a helpful coaching assistant. When someone asks a question or makes a statement, provide:\n" +
              "1. A best suggested reply (natural, helpful)\n" +
              "2. Two alternative reply options\n" +
              "3. A thoughtful follow-up question they could ask\n\n" +
              "Keep replies concise, natural, and authentic. Format as JSON with: bestReply, alternate1, alternate2, nextQuestion",
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
      res.status(response.status).json({ error: data });
      return;
    }

    // Parse the JSON response
    const content = data.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from GPT" });
      return;
    }

    const suggestions = JSON.parse(content);

    res.json({
      bestReply: suggestions.bestReply || "",
      alternate1: suggestions.alternate1 || "",
      alternate2: suggestions.alternate2 || "",
      nextQuestion: suggestions.nextQuestion || "",
    });
  } catch (err) {
    console.error("Suggestion generation error:", err);
    res.status(500).json({
      error: "Failed to generate suggestions",
      message: String(err?.message || err),
    });
  }
});

// Analysis endpoints for coaching feedback (works offline with saved transcript)
app.post("/api/analysis/followup", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    res.status(400).json({ error: "Transcript required" });
    return;
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
              "You are an expert coaching assistant. Analyze the conversation transcript and provide thoughtful follow-up questions the coach should ask. " +
              "Provide 5-7 strategic follow-up questions that will help the client reflect deeper, identify patterns, and think about improvements. " +
              "Format as JSON: { followupQuestions: [array of questions] }",
          },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nProvide follow-up questions for the coach.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data });
      return;
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json({ result: content.followupQuestions || [] });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/revised-story", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    res.status(400).json({ error: "Transcript required" });
    return;
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
              "You are an expert storytelling and communication coach. Analyze how the client told their story and provide a revised, improved version. " +
              "Show how they could have said it better - more clearly, powerfully, and effectively. " +
              "Format as JSON: { originalSummary: string, revisedStory: string, improvements: [array of improvements] }",
          },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nProvide a revised version of how they could tell this story better.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data });
      return;
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/feedback-summary", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    res.status(400).json({ error: "Transcript required" });
    return;
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
              "You are an expert coaching mentor. Analyze the conversation transcript and provide comprehensive feedback: " +
              "1. Key Strengths (what they did well) " +
              "2. Weaknesses/Areas for Improvement " +
              "3. What they said that wasn't good/effective " +
              "4. How they could improve each point " +
              "Format as JSON: { strengths: [array], weaknesses: [array], notGood: [array], improvements: [array] }",
          },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nProvide detailed feedback summary.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data });
      return;
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/interview-prep", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    res.status(400).json({ error: "Transcript required" });
    return;
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
              "You are an expert interview preparation coach. Analyze the conversation and provide feedback to 'raise the bar' for interview performance. " +
              "Focus on: STAR method improvements, communication clarity, impact statements, role-specific preparation. " +
              "Format as JSON: { starMethodFeedback: string, impactStatements: [array], roleSpecificTips: [array], raiseTheBar: string }",
          },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nProvide interview preparation feedback to raise the bar.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data });
      return;
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/analysis/full", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    res.status(400).json({ error: "Transcript required" });
    return;
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
              "You are an expert coaching mentor. Provide a comprehensive analysis of the conversation: " +
              "1. Follow-up question answer analysis (how they answered follow-ups) " +
              "2. Original story analysis " +
              "3. Detailed breakdown: weaknesses, strengths, what was wrong, how to improve " +
              "4. Actionable recommendations " +
              "Format as JSON with comprehensive sections covering all aspects. Be thorough and detailed.",
          },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nProvide full comprehensive analysis.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data });
      return;
    }

    const content = JSON.parse(data.choices[0]?.message?.content || "{}");
    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// Coach Assistant - Answer questions during session
app.post("/api/assistant", async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const { question, context, transcript } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.SUGGESTION_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful coaching assistant. Answer questions about the coaching session, candidate, conversation, or provide coaching strategies. Be concise, actionable, and helpful. Use the context provided to give relevant answers.`
          },
          {
            role: "user",
            content: `${context || ""}\n\nQuestion: ${question}`
          }
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

// Google Drive API - Save session to Google Doc
// Note: This is a simplified implementation. For production, you'd want:
// 1. OAuth 2.0 flow with proper token management
// 2. Refresh token handling
// 3. Error handling and retries
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
    
    // Format session as document content
    const docContent = formatSessionAsDoc(sessionData);
    
    // Create Google Doc
    const docResponse = await docs.documents.create({
      requestBody: {
        title: sessionData.name || "Coaching Session",
      },
    });
    
    const documentId = docResponse.data.documentId;
    
    // Insert content
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
    
    // Get document URL
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

// Helper function to format session as document
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

