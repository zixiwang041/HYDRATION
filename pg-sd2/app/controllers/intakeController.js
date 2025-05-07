const model = require("../models/intakeModels");

// Show intake form
exports.renderForm = (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  res.render("log-intake", {
    title: "Log Intake",
    name: req.session.name,
  });
};

// Save intake data
exports.submitForm = async (req, res) => {
  const { timeSlot, amount } = req.body;

  if (!req.session.userId || !timeSlot || !amount) {
    return res.status(400).send("Missing input or not logged in.");
  }

  const date = new Date().toISOString().split("T")[0];

  try {
    await model.saveIntake(req.session.userId, timeSlot, amount, date);
    res.redirect("/summary");
  } catch (err) {
    console.error("Failed to save intake:", err);
    res.status(500).send("Something went wrong.");
  }
};

// Show intake summary
exports.showSummary = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const intake = await model.getDailySummary(req.session.userId);
    const goal = await model.getGoal(req.session.userId);

    const summary = {
      morning: 0,
      afternoon: 0,
      night: 0,
      totalIntake: 0,
    };

    (intake || []).forEach((row) => {
      const amount = Number(row.total || 0);
      summary[row.time_slot] = amount;
      summary.totalIntake += amount;
    });

    res.render("summary", {
      title: "Summary",
      name: req.session.name,
      goal,
      ...summary,
    });
  } catch (err) {
    console.error("Summary load error:", err.message);
    res.status(500).send("Could not load summary.");
  }
};
