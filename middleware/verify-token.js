const authService = require("../services/auth.service");

const readBearerToken = (req) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];
  return token && token !== "undefined" && token !== "null" ? token : null;
};

// requires a valid, non-revoked token; sets req.user = { id, email, role }
const verifyToken = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }
  try {
    req.user = await authService.resolveSession(token);
    next();
  } catch (err) {
    return res.status(401).send("Invalid token.");
  }
};

verifyToken.readBearerToken = readBearerToken;

module.exports = verifyToken;
