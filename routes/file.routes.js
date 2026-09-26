const express = require("express");
const fileController = require("../controllers/file.controller");

const router = express.Router();

router.get("/:name", fileController.getImage);

module.exports = router;
