/**
 * ADMIN AUTH MIDDLEWARE — Lightweight password gate
 * 
 * Checks `x-admin-key` header against ADMIN_PASSWORD env variable.
 * No JWT, no sessions, no OAuth — just a simple gate for internal use.
 */

const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  }

  if (!key || key !== password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

module.exports = adminAuth;
