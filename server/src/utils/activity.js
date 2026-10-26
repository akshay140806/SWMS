import ActivityLog from '../models/ActivityLog.js';

export async function logActivity({ actor, action, entity = '', entityId = '', detail = '' }, session = null) {
  try {
    await ActivityLog.create([{ actor, action, entity, entityId, detail }], session ? { session } : {});
  } catch {
    // audit must never break the operation
  }
}
