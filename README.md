## Realtime transcription (browser, WebRTC)

Press **Start**, talk into your mic, and watch **live transcript text** appear.

### Setup

- **Requirements**: Node.js 18+
- **Env**: copy `.env.example` → `.env` and set `OPENAI_API_KEY`

### Run

```bash
npm install
npm start
```

Open `http://localhost:3000` and click **Start**.

### What this does

- **Browser**: connects to OpenAI Realtime over **WebRTC**, streams mic audio, and listens on a data channel for transcript events.
- **Server**: creates an **ephemeral Realtime session token** so the API key never reaches the browser.

### Notes

- Transcription config is sent via `session.update` with:
  - `input_audio_transcription.model = "gpt-4o-transcribe"`
  - `turn_detection.type = "server_vad"`

