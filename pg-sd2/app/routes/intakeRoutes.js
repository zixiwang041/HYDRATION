//const express = require("express");
//const router = express.Router();
//const controller = require("../controllers/intakeController");

//router.get("/log-intake", controller.renderForm);
//router.post("/log-intake", controller.submitForm);
//router.get("/summary", controller.showSummary);

//module.exports = router;

const express = require("express");
const router = express.Router();
const intakeController = require("../controllers/intakeController");

router.get("/log-intake", intakeController.renderForm);
router.post("/log-intake", intakeController.submitForm);
router.get("/summary", intakeController.showSummary);

module.exports = router;
