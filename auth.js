/* 1XL Platform — authentication & sessions (built-in crypto only). */
const crypto = require('crypto');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return salt + ':' + h;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, h] = stored.split(':');
  const hh = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hh, 'hex')); }
  catch (e) { return false; }
}
function createSession(userId) {
  const { run, now } = require('./db');
  const token = crypto.randomBytes(24).toString('hex');
  run('INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)', token, userId, now());
  return token;
}
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
function userByToken(token) {
  if (!token) return null;
  const { get, run } = require('./db');
  const s = get('SELECT user_id, created_at FROM sessions WHERE token=?', token);
  if (!s) return null;
  // Expire stale sessions (created_at is an ISO string).
  const age = Date.now() - Date.parse(s.created_at);
  if (Number.isFinite(age) && age > SESSION_TTL_MS) { run('DELETE FROM sessions WHERE token=?', token); return null; }
  const u = get('SELECT id,email,full_name,is_staff,status FROM users WHERE id=?', s.user_id);
  if (!u) return null;
  // A suspended/deactivated user's existing token must stop working immediately.
  if (u.status && u.status !== 'active') return null;
  return u;
}
function deleteSession(token) {
  const { run } = require('./db');
  run('DELETE FROM sessions WHERE token=?', token);
}
function rolesFor(userId) {
  const { all } = require('./db');
  return all('SELECT r.key, r.scope, ur.company_id FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?', userId);
}
function companiesFor(userId) {
  const { all } = require('./db');
  return all('SELECT DISTINCT c.id, c.name, c.lifecycle_stage FROM companies c LEFT JOIN company_members m ON m.company_id=c.id WHERE m.user_id=? OR c.owner_id=?', userId, userId);
}
module.exports = { hashPassword, verifyPassword, createSession, userByToken, deleteSession, rolesFor, companiesFor };
