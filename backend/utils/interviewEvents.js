import InterviewEvent from '../models/InterviewEvent.js';

const truncate = (value, max = 2000) => {
  if (typeof value !== 'string') return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

export const sanitizePayload = (payload = {}) => {
  const sanitized = { ...payload };
  if (typeof sanitized.code === 'string') sanitized.code = truncate(sanitized.code, 4000);
  if (typeof sanitized.output === 'string') sanitized.output = truncate(sanitized.output, 2000);
  if (typeof sanitized.notes === 'string') sanitized.notes = truncate(sanitized.notes, 2000);
  if (typeof sanitized.message === 'string') sanitized.message = truncate(sanitized.message, 500);
  if (typeof sanitized.rule === 'string') sanitized.rule = truncate(sanitized.rule, 100);
  return sanitized;
};

export const logInterviewEvent = async ({ roomId, type, actor, payload = {} }) => {
  try {
    if (!roomId || !type) return;
    await InterviewEvent.create({
      roomId,
      type,
      actor: {
        userId: actor?.userId || null,
        username: actor?.username || 'anonymous',
        role: actor?.role || 'unknown'
      },
      payload: sanitizePayload(payload),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log interview event:', error.message);
  }
};
