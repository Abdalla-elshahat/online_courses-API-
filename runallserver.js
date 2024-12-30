const express = require("express");
const app = express();

// Import both route handlers
const courses = require("./courses");
const auth = require("./auth");

// Use routes from both files
app.use("/api/courses",courses);
app.use("/api/users",auth);

// Handle unmatched routes
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start the server on a single port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
