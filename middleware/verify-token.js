const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    if (!authHeader) {
      return res.status(401).send("Access denied. No token provided.");
    }
    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).send("Access denied. Token missing.");
    }
    req.user = jwt.verify(token, process.env.jwtsecret);
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).send("Invalid token.");
  }
};

module.exports = verifyToken;
