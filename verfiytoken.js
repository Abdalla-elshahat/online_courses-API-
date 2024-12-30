const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    if (!authHeader) {
      return res.status(401).send("Access denied. No token provided.");
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access denied. Token missing.");
    }
    const decoded = jwt.verify(token, process.env.jwtsecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(400).send("Invalid token.");
  }
};

module.exports = verifyToken;
