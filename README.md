# Coach Copilot

A real-time transcription and AI coaching assistant for mentoring sessions. Built with OpenAI Realtime API, React, and modern web technologies.

## Features

- 🎙️ **Real-time Transcription** - Live transcription of coaching sessions using OpenAI Realtime API
- 🤖 **AI Coaching Assistant** - Interactive chat assistant for real-time coaching support
- 📊 **Session Analysis** - Multiple analysis tools (follow-up questions, feedback summary, interview prep, etc.)
- 📚 **Session Library** - View, search, and manage all your coaching sessions
- 💾 **Export & Import** - Save sessions as JSON or import old session files
- 📄 **Google Drive Integration** - Save sessions directly to Google Docs
- 📱 **PWA Support** - Install as a Progressive Web App, works offline
- 🎯 **Materials Library** - Upload and auto-select coaching materials based on session context
- 📧 **Email Parsing** - Auto-fill session details from booking confirmation emails

## Tech Stack

- **Frontend**: React (with Vite) + Vanilla JS (legacy)
- **Backend**: Node.js + Express
- **Real-time**: OpenAI Realtime API (WebRTC)
- **Storage**: localStorage (sessions), Google Drive API (optional)
- **AI Models**: 
  - `gpt-4o-realtime-preview` for transcription
  - `gpt-4o-mini` for suggestions and analysis

## Project Structure

```
realtime-transcribe/
├── src/                    # React application (new)
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── App.jsx             # Main React app
│   └── main.jsx            # React entry point
├── public/                 # Static files and legacy app
│   ├── index.html          # Main HTML (legacy)
│   ├── app.js              # Legacy JavaScript app
│   ├── sessions.html       # Session library page
│   ├── sessions.js         # Session library logic
│   ├── help.html           # Help documentation
│   ├── styles.css          # Global styles
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── data/                   # Data storage
│   └── sessions/           # Session files (user data)
├── server.js               # Express backend server
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## Setup

### Prerequisites

- Node.js >= 18
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd realtime-transcribe
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
SUGGESTION_MODEL=gpt-4o-mini
```

### Running the Application

**Option 1: Legacy Vanilla JS App (Fully Functional)**
```bash
npm start
```
Visit http://localhost:3000

**Option 2: React Development Server**
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start React dev server
npm run dev:react
```
Visit http://localhost:3001

**Option 3: Production Build**
```bash
npm run build
npm start
```

## Usage

### Starting a Session

1. Click "Start Session" button
2. Fill in session details:
   - Candidate name (required)
   - Role/Position
   - Interview/Coaching type
   - Coaching agenda
3. Optionally paste booking email to auto-fill details
4. Click "Start Session"

### Capturing Audio

1. Open Google Meet or YouTube in a separate tab
2. Click "Start Tab Capture" (or it starts automatically)
3. In the browser dialog:
   - Select "Chrome Tab" (NOT "Entire Screen")
   - Pick the tab with your meeting/video
   - Enable "Share tab audio" checkbox
   - Click "Share"

### Using Features

- **Live Transcript**: Appears automatically as people speak (WhatsApp-style chat)
- **Toggle Speaker**: Click "🎤 I'm Speaking" when you (coach) are talking
- **Get Suggestions**: Click "Get Suggestions" for AI reply options
- **Coach Assistant**: Type questions in the assistant chat pane
- **Analysis Tools**: Use buttons in Analysis pane (works offline)
- **Session Library**: Click "📚 Sessions" in header to view all sessions

### Saving Sessions

- **Auto-save**: Sessions are automatically saved to browser localStorage
- **Export**: Click "💾 Export" to download as JSON
- **Import**: Click "📥 Import" to load a JSON session file
- **Google Drive**: Click "📄 Save to Drive" (requires OAuth token setup)

### Importing Old Sessions

1. Go to Sessions page (📚 Sessions in header)
2. Click "📥 Import Old Sessions"
3. Select `.txt` files from your old sessions folder
4. Files are automatically parsed and imported

## Google Drive Integration

To enable Google Drive save:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Get access token (for testing, use [OAuth Playground](https://developers.google.com/oauthplayground/))
6. When prompted, paste the access token

**Note**: For production, implement proper OAuth 2.0 flow with refresh tokens.

## Development

### Project Structure

- **Legacy App**: `public/` folder contains the original vanilla JS implementation (fully functional)
- **React App**: `src/` folder contains the new React implementation (in progress)
- **Backend**: `server.js` handles API endpoints and serves static files

### Key Files

- `public/app.js` - Main application logic (legacy)
- `src/App.jsx` - React main component
- `src/hooks/useRealtimeTranscription.js` - Real-time transcription hook
- `src/hooks/useSession.js` - Session management hook
- `server.js` - Express backend with API endpoints

### API Endpoints

- `POST /api/session` - Create OpenAI Realtime session
- `POST /api/suggestions` - Get AI coaching suggestions
- `POST /api/assistant` - Coach assistant chat
- `POST /api/save-to-drive` - Save session to Google Drive

## Browser Support

- Chrome/Edge (recommended) - Full support
- Firefox - Supported
- Safari - Limited (WebRTC may have issues)

## PWA Installation

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use "Add to Home Screen" on mobile

## Troubleshooting

### No audio captured
- Make sure you selected "Chrome Tab" (not "Entire Screen")
- Check that "Share tab audio" is enabled
- Try refreshing and starting again

### Transcript not appearing
- Check internet connection
- Verify audio is playing in source tab
- Check browser console for errors

### Google Drive save fails
- Verify OAuth token is valid
- Check that Google Drive API is enabled
- Ensure proper permissions are granted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is an active development project. The React version is in progress, while the legacy vanilla JS version is fully functional.
