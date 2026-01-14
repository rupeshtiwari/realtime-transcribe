import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

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
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Help & Documentation
        </h1>

        <div className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">1. Start a New Session</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click <strong>"Start Session"</strong> button in the header</li>
              <li>Fill in the session form or paste a booking email to auto-fill</li>
              <li>Materials will be auto-selected based on role and coaching type</li>
              <li>Click <strong>"Start Session"</strong> to begin</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">2. Capture Audio</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open Google Meet or YouTube in a separate tab</li>
              <li>Click <strong>"Start Session"</strong> (or it starts automatically)</li>
              <li>In the browser dialog:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li>Select the <strong>"Chrome Tab"</strong> option (⚠️ NOT "Entire Screen")</li>
                  <li>Pick the tab with your meeting/video</li>
                  <li>Enable <strong>"Share tab audio"</strong> checkbox</li>
                  <li>Click <strong>"Share"</strong></li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <strong>⚠️ Important:</strong> Pick "Chrome Tab" (not "Entire Screen") and enable "Share tab audio".
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">3. Real-time Transcription</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Transcript appears in a WhatsApp-style chat interface</li>
              <li>Click <strong>"🎤 I'm Speaking"</strong> when you (coach) are talking</li>
              <li>Messages show with speaker icons and timestamps</li>
              <li>Transcript auto-scrolls to show latest messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">4. AI Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Get Suggestions:</strong> Click to get AI reply suggestions</li>
              <li><strong>Analysis Tools:</strong> Use buttons for follow-up questions, feedback, etc.</li>
              <li><strong>Coach Assistant:</strong> Ask questions anytime in the chat</li>
              <li>All features work offline after initial connection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">5. Save & Export</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Sessions are automatically saved to browser storage</li>
              <li>Click <strong>"💾 Export"</strong> to download as JSON</li>
              <li>View all sessions in the <Link to="/sessions" className="text-primary underline">Sessions</Link> page</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
