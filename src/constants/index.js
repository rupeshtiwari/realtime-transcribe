// Application constants

export const APP_NAME = 'Coach Copilot';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_BASE = '/api';

// Session constants
export const SESSION_STORAGE_KEY = 'coach-copilot-sessions';
export const MATERIALS_STORAGE_KEY = 'coach-copilot-materials';

// Analysis types
export const ANALYSIS_TYPES = [
  { id: 'followup', label: 'Follow-up Questions', endpoint: 'followup' },
  { id: 'revised-story', label: 'Revised Story', endpoint: 'revised-story' },
  { id: 'feedback-summary', label: 'Feedback Summary', endpoint: 'feedback-summary' },
  { id: 'interview-prep', label: 'Interview Prep', endpoint: 'interview-prep' },
  { id: 'full', label: 'Full Analysis', endpoint: 'full' },
];

// Coaching types
export const COACHING_TYPES = [
  { value: 'system-design', label: 'System Design Interview' },
  { value: 'behavioral', label: 'Behavioral Interview' },
  { value: 'technical', label: 'Technical Interview' },
  { value: 'mock-interview', label: 'Mock Interview' },
  { value: 'resume-review', label: 'Resume Review' },
];

// File upload limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_FILE_TYPES = ['.pdf', '.txt', '.md', '.docx', '.doc'];

// Toast defaults
export const TOAST_DURATION = 3000;
export const TOAST_POSITION = 'top-right';
