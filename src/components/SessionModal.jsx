import { useState, useEffect } from 'react';
import { useMaterialsStore } from '../store/useMaterialsStore';
import { parseEmail, autoGenerateSessionName } from '../utils/emailParser';
import { api } from '../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionModal({ onClose, onStart }) {
  const [formData, setFormData] = useState({
    candidateName: '',
    role: '',
    coachingType: '',
    coachingAgenda: '',
    sessionName: '',
  });
  const [emailText, setEmailText] = useState('');
  const { selectedMaterials, setSelectedMaterials } = useMaterialsStore();

  useEffect(() => {
    // Auto-generate session name when fields change
    if (formData.candidateName || formData.role || formData.coachingType) {
      const autoName = autoGenerateSessionName(
        formData.candidateName,
        formData.role,
        formData.coachingType
      );
      if (!formData.sessionName || formData.sessionName === autoName) {
        setFormData((prev) => ({ ...prev, sessionName: autoName }));
      }
    }
  }, [formData.candidateName, formData.role, formData.coachingType]);

  const handleParseEmail = async () => {
    if (!emailText.trim()) {
      toast.error('Please paste the booking email first');
      return;
    }

    const loadingToast = toast.loading('Parsing email...');

    try {
      const parsed = parseEmail(emailText);
      setFormData((prev) => ({
        ...prev,
        candidateName: parsed.candidateName || prev.candidateName,
        role: parsed.role || prev.role,
        coachingType: parsed.coachingType || prev.coachingType,
        coachingAgenda: parsed.coachingAgenda || prev.coachingAgenda,
      }));

      // Auto-select materials from folder
      if (parsed.role || parsed.coachingType) {
        try {
          const data = await api.matchMaterials(parsed.role, parsed.coachingType, parsed.coachingAgenda);
          setSelectedMaterials(data.materials.map((m) => m.path || m.name));
          toast.dismiss(loadingToast);
          toast.success(`Email parsed! ${data.materials.length} materials auto-selected.`, {
            duration: 4000,
          });
        } catch (err) {
          console.warn('Error matching materials:', err);
          toast.dismiss(loadingToast);
          toast.success('Email parsed! Please review and adjust the fields.', {
            duration: 4000,
          });
        }
      } else {
        toast.dismiss(loadingToast);
        toast.success('Email parsed! Please review and adjust the fields.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to parse email. Please check the format.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.candidateName || !formData.role || !formData.coachingType) {
      toast.error('Please fill in Candidate Name, Role, and Coaching Type');
      return;
    }

    const sessionName = formData.sessionName || autoGenerateSessionName(
      formData.candidateName,
      formData.role,
      formData.coachingType
    );

    onStart({
      ...formData,
      name: sessionName,
      selectedMaterials: selectedMaterials,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Start New Coaching Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Parser */}
          <div>
            <label className="block text-sm font-medium mb-2">
              📧 Paste Booking Email (Optional - Auto-fills form)
            </label>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={6}
              placeholder="Paste the booking confirmation email here..."
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleParseEmail}
              className="mt-2 btn btn--small"
            >
              Parse Email
            </button>
          </div>

          {/* Candidate Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Candidate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.candidateName}
              onChange={(e) => setFormData((prev) => ({ ...prev, candidateName: e.target.value }))}
              placeholder="e.g., Jane Doe"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Candidate Role/Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Coaching Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Interview/Coaching Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.coachingType}
              onChange={(e) => setFormData((prev) => ({ ...prev, coachingType: e.target.value }))}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type...</option>
              <option value="system-design">System Design Interview</option>
              <option value="behavioral">Behavioral Interview</option>
              <option value="technical">Technical Interview</option>
              <option value="mock-interview">Mock Interview</option>
              <option value="resume-review">Resume Review</option>
            </select>
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium mb-2">Coaching Agenda (Optional)</label>
            <textarea
              value={formData.coachingAgenda}
              onChange={(e) => setFormData((prev) => ({ ...prev, coachingAgenda: e.target.value }))}
              rows={4}
              placeholder="Additional notes, companies, interview dates..."
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Selected Materials */}
          {selectedMaterials.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Selected Materials</label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {selectedMaterials.map((material, idx) => {
                  const fileName = material.includes('/') || material.includes('\\')
                    ? material.split(/[/\\]/).pop()
                    : material;
                  return (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                    >
                      {fileName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Session Name (Auto-generated, can edit)
            </label>
            <input
              type="text"
              value={formData.sessionName}
              onChange={(e) => setFormData((prev) => ({ ...prev, sessionName: e.target.value }))}
              placeholder="Will be auto-generated from above fields"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn--primary flex-1">
              Start Session
            </button>
            <button type="button" onClick={onClose} className="btn flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
