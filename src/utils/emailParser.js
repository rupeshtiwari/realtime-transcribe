// Email parsing utility

export function parseEmail(emailText) {
  const extracted = {
    candidateName: '',
    role: '',
    coachingType: '',
    coachingAgenda: '',
  };

  if (!emailText || !emailText.trim()) return extracted;

  // Extract candidate name (look for patterns like "Bruno / Rupesh")
  const nameMatch = emailText.match(/([A-Z][a-z]+)\s*\/\s*([A-Z][a-z]+)/);
  if (nameMatch) {
    extracted.candidateName = nameMatch[1].trim();
  }

  // Extract role
  const roleMatch = emailText.match(/\[What role are you interviewing for\?\]\s*\n?\s*([^\[]+)/i);
  if (roleMatch) {
    extracted.role = roleMatch[1].trim();
  }

  // Extract coaching type
  const questionTypeMatch = emailText.match(/\[What's the primary type of interview question[^\]]*\]\s*\n?\s*([^\[]+)/i);
  if (questionTypeMatch) {
    const questionType = questionTypeMatch[1].trim().toLowerCase();
    if (questionType.includes('system design') || questionType.includes('hpc cluster') || questionType.includes('infrastructure')) {
      extracted.coachingType = 'system-design';
    } else if (questionType.includes('behavioral') || questionType.includes('behavior')) {
      extracted.coachingType = 'behavioral';
    } else if (questionType.includes('coding') || questionType.includes('technical') || questionType.includes('algorithm')) {
      extracted.coachingType = 'technical';
    } else {
      extracted.coachingType = 'technical';
    }
  }

  // Extract notes/agenda
  const notesMatch = emailText.match(/\[Do you have additional notes[^\]]*\]\s*\n?\s*([^\[]+)/i);
  if (notesMatch) {
    extracted.coachingAgenda = notesMatch[1].trim();
  }

  // Extract companies and dates
  const companiesMatch = emailText.match(/\[What companies are you interviewing with\?\]\s*\n?\s*([^\[]+)/i);
  const datesMatch = emailText.match(/\[When's your next interview[^\]]*\]\s*\n?\s*([^\[]+)/i);

  const agendaParts = [];
  if (extracted.coachingAgenda) agendaParts.push(extracted.coachingAgenda);
  if (companiesMatch) agendaParts.push(`Companies: ${companiesMatch[1].trim()}`);
  if (datesMatch) agendaParts.push(`Interview Dates: ${datesMatch[1].trim()}`);

  if (agendaParts.length > 0) {
    extracted.coachingAgenda = agendaParts.join('\n\n');
  }

  return extracted;
}

export function autoGenerateSessionName(candidateName, role, coachingType) {
  const parts = [];
  if (candidateName) parts.push(candidateName);
  if (role) parts.push(role);
  if (coachingType) {
    const typeMap = {
      'system-design': 'System Design',
      'behavioral': 'Behavioral',
      'technical': 'Technical',
    };
    parts.push(typeMap[coachingType] || coachingType);
  }
  return parts.join(' - ') || 'Untitled Session';
}
