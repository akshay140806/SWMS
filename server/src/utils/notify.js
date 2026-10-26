import Notification from '../models/Notification.js';
import { emit } from '../socket.js';

export async function notify({ user = null, kind = 'system', message, link = '' }, session = null) {
  const doc = await Notification.create([{ user, kind, message, link }], session ? { session } : {});
  const n = Array.isArray(doc) ? doc[0] : doc;
  emit('notification', { id: n._id, kind, message, link });
  return n;
}

export async function notifyAll(args, session = null) {
  return notify({ ...args, user: null }, session);
}
