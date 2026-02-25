const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, email: user.email, fullName: user.full_name || '', country: user.country || '' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  signToken,
  requireAuth
};
