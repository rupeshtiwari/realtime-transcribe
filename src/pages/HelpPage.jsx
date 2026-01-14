import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, Mic, Sparkles, Bot, FileText, Save, FolderOpen, Smartphone, Lightbulb, AlertCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>

        <div className="bg-surface rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            How to Use Coach Copilot
          </h1>
          <p className="text-text-secondary mb-8">
            Complete guide to using the real-time transcription and AI coaching assistant
          </p>

          <div className="prose prose-sm max-w-none space-y-8">
            {/* 1. Start a New Session */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Play className="w-6 h-6" />
                1. Start a New Session
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-base">
                <li>Click <strong>"Start Session"</strong> button in the header or on the main page</li>
                <li>Fill in the session form:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>Candidate Name</strong> - Name of the person you're coaching</li>
                    <li><strong>Role/Position</strong> - Their job title or role (e.g., Senior Software Engineer)</li>
                    <li><strong>Interview/Coaching Type</strong> - Select the type (System Design, Behavioral, Technical, etc.)</li>
                    <li><strong>Coaching Agenda</strong> - Optional notes about what to cover, companies, interview dates</li>
                  </ul>
                </li>
                <li><strong>Optional:</strong> Paste a booking confirmation email in the text area and click "Parse Email" to auto-fill the form</li>
                <li>Materials will be <strong>auto-selected</strong> based on role and coaching type</li>
                <li>Click <strong>"Start Session"</strong> to begin</li>
              </ol>
            </section>

            {/* 2. Capture Audio */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Mic className="w-6 h-6" />
                2. Capture Audio
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-base">
                <li><strong>Open Google Meet or YouTube</strong> in a separate tab (keep it open)</li>
                <li><strong>Come back to this tab</strong> and click <strong>"Start Session"</strong> (or it starts automatically after session setup)</li>
                <li>In the browser popup dialog:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Select the <strong>"Chrome Tab"</strong> option (⚠️ NOT "Entire Screen")</li>
                    <li>Pick the tab with your Google Meet or YouTube video</li>
                    <li>Make sure <strong>"Share tab audio"</strong> checkbox is checked ✓</li>
                    <li>Click <strong>"Share"</strong></li>
                  </ul>
                </li>
              </ol>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
                <strong>⚠️ Important:</strong> Pick "Chrome Tab" (not "Entire Screen") and enable "Share tab audio". This ensures reliable audio capture.
              </div>
            </section>

            {/* 3. Real-time Transcription */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                3. Real-time Transcription
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Transcript will appear</strong> as people speak in a WhatsApp-style chat interface</li>
                <li><strong>Toggle speaker:</strong> Click <strong>"🎤 I'm Speaking"</strong> button when you (coach) are speaking</li>
                <li>Messages show with speaker icons - <strong>Coach</strong> (green, right side) and <strong>Client</strong> (blue, left side)</li>
                <li>Each message includes a timestamp</li>
                <li>Transcript auto-scrolls to show the latest messages</li>
                <li>You can scroll up to review previous messages</li>
              </ul>
            </section>

            {/* 4. Get AI Suggestions */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                4. Get AI Suggestions
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Click "Get Suggestions"</strong> when you want AI reply suggestions (not automatic - you control when to get them)</li>
                <li>You'll see:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>Best Reply</strong> - Top recommendation for your next response</li>
                    <li><strong>Alternate 1 & 2</strong> - Alternative options to consider</li>
                    <li><strong>Next Question</strong> - Suggested follow-up question to ask</li>
                  </ul>
                </li>
                <li>Suggestions are based on the current transcript and session context</li>
              </ul>
            </section>

            {/* 5. Coach Assistant Chat */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Bot className="w-6 h-6" />
                5. Coach Assistant Chat
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Ask questions anytime</strong> in the "🤖 Coach Assistant" pane</li>
                <li>Type questions about:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>The conversation so far</li>
                    <li>The candidate's responses</li>
                    <li>Coaching strategies</li>
                    <li>Next steps</li>
                    <li>How to improve their answers</li>
                  </ul>
                </li>
                <li>Works <strong>offline</strong> - uses transcript context even after disconnecting</li>
                <li>Press <strong>Enter</strong> to send your question</li>
                <li>The assistant has full context of the session, transcript, and selected materials</li>
              </ul>
            </section>

            {/* 6. Analysis Tools */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                6. Analysis Tools (Works Offline)
              </h2>
              <p className="mb-3 text-base">
                After you have transcript content, you can use these analysis tools even after disconnecting:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Follow-up Questions</strong> - Get suggested follow-up questions based on the conversation</li>
                <li><strong>Revised Story</strong> - See how the candidate could improve their story using STAR method</li>
                <li><strong>Feedback Summary</strong> - Get strengths, weaknesses, and improvement suggestions</li>
                <li><strong>Interview Prep</strong> - STAR method feedback and role-specific tips</li>
                <li><strong>Full Analysis</strong> - Comprehensive analysis of the conversation</li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded">
                <strong>📝 Note:</strong> All analysis results are saved in a notebook-style format - previous results are never overwritten. You can generate multiple analyses and review them all.
              </div>
            </section>

            {/* 7. Save & Export */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Save className="w-6 h-6" />
                7. Save & Export Sessions
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Auto-save:</strong> Sessions are automatically saved to your browser's local storage</li>
                <li><strong>Export:</strong> Click "💾 Export" to download session as JSON file</li>
                <li><strong>View Sessions:</strong> Go to the <Link to="/sessions" className="text-primary underline">Sessions</Link> page to view all your saved sessions</li>
                <li><strong>Import:</strong> Use the "Import Old Sessions" button to load previously exported session files</li>
                <li><strong>Save to Google Drive:</strong> Click "📄 Drive" to save session as a Google Doc (requires OAuth setup)</li>
              </ul>
            </section>

            {/* 8. Materials Library */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                8. Materials Library
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Upload materials</strong> (frameworks, documents, reference materials) in the <Link to="/materials" className="text-primary underline">Materials</Link> page</li>
                <li>Materials are <strong>auto-selected</strong> when you parse a booking email</li>
                <li>Materials are matched based on role, coaching type, and agenda keywords</li>
                <li>Uploaded materials are stored locally and automatically synced to OpenAI Assistant</li>
                <li>Materials are embedded once and reused for all sessions (cost-efficient)</li>
                <li>Supported formats: PDF, TXT, MD, DOCX (max 50MB per file)</li>
              </ul>
            </section>

            {/* 9. Mobile & PWA */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Smartphone className="w-6 h-6" />
                9. Mobile & PWA
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Mobile-friendly:</strong> The app works great on phones and tablets</li>
                <li><strong>Install as PWA:</strong> On mobile, use "Add to Home Screen" to install as an app</li>
                <li><strong>Offline support:</strong> Works offline after initial load (service worker caches resources)</li>
                <li><strong>Touch-optimized:</strong> All buttons and inputs are optimized for touch</li>
                <li><strong>Responsive design:</strong> Layout adapts to different screen sizes</li>
              </ul>
            </section>

            {/* Tips & Best Practices */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                💡 Tips & Best Practices
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Toggle speaker button:</strong> Remember to click "I'm Speaking" when you're talking to ensure proper speaker identification</li>
                <li><strong>Get suggestions:</strong> Use "Get Suggestions" during natural pauses in conversation</li>
                <li><strong>Ask questions:</strong> Use the Coach Assistant anytime - it has full context of the conversation</li>
                <li><strong>Review analysis:</strong> All analysis results are saved - review them after the session</li>
                <li><strong>Export regularly:</strong> Export important sessions as backup</li>
                <li><strong>Materials:</strong> Upload your coaching frameworks once - they'll be auto-selected for relevant sessions</li>
                <li><strong>Email parsing:</strong> Use the email parser to quickly set up sessions from booking confirmations</li>
                <li><strong>Session library:</strong> Keep track of all your sessions in the Sessions page</li>
              </ul>
            </section>

            {/* Troubleshooting */}
            <section className="help-section">
              <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                ❓ Troubleshooting
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">No audio captured</h3>
                  <ul className="list-disc list-inside space-y-1 text-base ml-4">
                    <li>Make sure you selected a <strong>Chrome Tab</strong> (not "Entire Screen")</li>
                    <li>Check that <strong>"Share tab audio"</strong> is enabled</li>
                    <li>Verify the audio is playing in the source tab (Google Meet/YouTube)</li>
                    <li>Try refreshing and starting again</li>
                    <li>Check browser permissions for microphone/screen sharing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Transcript not appearing</h3>
                  <ul className="list-disc list-inside space-y-1 text-base ml-4">
                    <li>Check your internet connection</li>
                    <li>Verify the audio is playing in the source tab</li>
                    <li>Check the browser console for errors (F12)</li>
                    <li>Make sure OpenAI API key is set in environment variables</li>
                    <li>Try stopping and restarting the session</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Assistant not responding</h3>
                  <ul className="list-disc list-inside space-y-1 text-base ml-4">
                    <li>Make sure you have transcript content</li>
                    <li>Check your internet connection (for online responses)</li>
                    <li>Try rephrasing your question</li>
                    <li>Wait a few seconds and try again</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Materials not auto-selecting</h3>
                  <ul className="list-disc list-inside space-y-1 text-base ml-4">
                    <li>Make sure you have materials uploaded in the Materials page</li>
                    <li>Check that role and coaching type are filled in</li>
                    <li>Try parsing the email again after filling in the form</li>
                    <li>Check the browser console for any errors</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
