import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionStorage } from '../utils/sessionStorage';
import { BookOpen, Search, Filter, Trash2, Download, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, filterType]);

  const loadSessions = () => {
    const allSessions = sessionStorage.getAllSessions();
    setSessions(allSessions);
    setFilteredSessions(allSessions);
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.candidateName?.toLowerCase().includes(term) ||
          s.role?.toLowerCase().includes(term)
      );
    }

    if (filterType) {
      filtered = filtered.filter((s) => s.coachingType === filterType);
    }

    setFilteredSessions(filtered);
  };

  const handleDelete = async (sessionId) => {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Delete session?</p>
            <p className="text-sm text-gray-600">This cannot be undone.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (confirmed) {
      sessionStorage.deleteSession(sessionId);
      loadSessions();
      toast.success('Session deleted successfully');
    }
  };

  const handleExport = (sessionId) => {
    const sessionData = sessionStorage.loadSession(sessionId);
    if (sessionData) {
      sessionStorage.exportSession(sessionData);
    }
  };

  const handleView = (sessionId) => {
    const sessionData = sessionStorage.loadSession(sessionId);
    if (sessionData) {
      setSelectedSession(sessionData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Session Library
        </h1>
        <p className="text-text-secondary">View and manage all your coaching sessions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="system-design">System Design</option>
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">No sessions found.</p>
          <Link to="/" className="btn btn--primary">
            Start New Session
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg flex-1">{session.name}</h3>
                <span className="text-xs text-text-secondary">
                  {new Date(session.updatedAt || session.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-1 text-sm text-text-secondary mb-4">
                <div>
                  <strong>Candidate:</strong> {session.candidateName || 'N/A'}
                </div>
                <div>
                  <strong>Role:</strong> {session.role || 'N/A'}
                </div>
                <div>
                  <strong>Type:</strong> {session.coachingType || 'N/A'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(session.id)}
                  className="btn btn--small flex-1 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleExport(session.id)}
                  className="btn btn--small flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="btn btn--small btn--danger flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedSession.name}</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Session Information</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Date:</strong> {new Date(selectedSession.startTime).toLocaleString()}</div>
                  <div><strong>Candidate:</strong> {selectedSession.candidateName || 'N/A'}</div>
                  <div><strong>Role:</strong> {selectedSession.role || 'N/A'}</div>
                  <div><strong>Type:</strong> {selectedSession.coachingType || 'N/A'}</div>
                </div>
              </div>
              {selectedSession.transcriptMessages && selectedSession.transcriptMessages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Transcript</h3>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm max-h-60 overflow-y-auto">
                    {selectedSession.transcriptMessages.map((msg, idx) => (
                      <div key={idx} className="mb-2">
                        <strong>{msg.speaker === 'coach' ? 'Coach' : 'Client'}:</strong> {msg.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
