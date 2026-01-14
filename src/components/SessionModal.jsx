import React, { useState } from 'react';

function SessionModal({ onClose, onStart }) {
  const [formData, setFormData] = useState({
    candidateName: '',
    role: '',
    coachingType: '',
    coachingAgenda: '',
    sessionName: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const sessionName = formData.sessionName || 
      `${formData.candidateName}${formData.role ? ` - ${formData.role}` : ''}${formData.coachingType ? ` - ${formData.coachingType}` : ''}`.trim() ||
      'Untitled Session';
    
    onStart({
      ...formData,
      name: sessionName,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal__content">
        <div className="modal__header">
          <h2 className="modal__title">Start New Session</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label>Candidate Name *</label>
            <input
              type="text"
              required
              value={formData.candidateName}
              onChange={(e) => handleChange('candidateName', e.target.value)}
            />
          </div>
          <div className="modal__field">
            <label>Role/Position</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            />
          </div>
          <div className="modal__field">
            <label>Interview/Coaching Type</label>
            <select
              value={formData.coachingType}
              onChange={(e) => handleChange('coachingType', e.target.value)}
            >
              <option value="">Select type...</option>
              <option value="System Design">System Design</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Technical">Technical</option>
              <option value="Mock Interview">Mock Interview</option>
              <option value="Resume Review">Resume Review</option>
            </select>
          </div>
          <div className="modal__field">
            <label>Coaching Agenda</label>
            <textarea
              value={formData.coachingAgenda}
              onChange={(e) => handleChange('coachingAgenda', e.target.value)}
              rows={4}
            />
          </div>
          <div className="modal__field">
            <label>Session Name (auto-generated if empty)</label>
            <input
              type="text"
              value={formData.sessionName}
              onChange={(e) => handleChange('sessionName', e.target.value)}
              placeholder="Will be auto-generated from above fields"
            />
          </div>
          <div className="modal__actions">
            <button type="submit" className="btn btn--primary">
              Start Session
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SessionModal;
