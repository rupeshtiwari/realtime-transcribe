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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

