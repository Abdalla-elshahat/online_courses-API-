const express = require("express");
const app = express();
const path = require("path");
const courses = require("./courses");
const auth = require("./auth");
const quiz = require("./quiz");
app.use("/uplouds", express.static(path.join(__dirname, "uplouds"))); // عرض الصور الثابتة

app.use("/api/courses",courses);
app.use("/api/users",auth);
app.use("/api/quiz",quiz);

app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// const swaggerJsDoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");
// // إعدادات Swagger
// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Courses API",
//       version: "1.0.0",
//       description: "API for managing courses",
//     },
//     servers: [
//       {
//         url: "http://localhost:4000",
//       },
//     ],
//   },
//   apis: ["/auth.js"],
// };

// const swaggerDocs = swaggerJsDoc(swaggerOptions);
// // إضافة Swagger UI
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Use routes from both files