// Import dependencies
const express = require("express");
const schedule = require("node-schedule"); // For scheduling daily reset
const db = require("./services/db");

// Create express app
const app = express();

// Use the Pug templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");

// Add static files location
app.use(express.static("static"));

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Check Database Connection
async function testDatabaseConnection() {
  try {
    await db.query("SELECT 1");
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}
testDatabaseConnection(); // Run DB test

// Ensure `water_intake` Table Exists
async function ensureTableExists() {
  try {
    let sql = `
      CREATE TABLE IF NOT EXISTS water_intake (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_slot ENUM('morning', 'afternoon', 'night') NOT NULL,
        amount INT NOT NULL DEFAULT 0,
        recorded_date DATE NOT NULL,
        UNIQUE KEY unique_entry (time_slot, recorded_date)
      )
    `;
    await db.query(sql);
    console.log("Table check completed.");
  } catch (error) {
    console.error("Error ensuring table exists:", error.message);
    process.exit(1);
  }
}
ensureTableExists();

// Reset Daily Water Intake at Midnight
schedule.scheduleJob("0 0 * * *", async function () {
  try {
    let todayDate = new Date().toISOString().split("T")[0];

    let resetSQL = `
      INSERT INTO water_intake (time_slot, amount, recorded_date)
      VALUES 
        ('morning', 0, ?), 
        ('afternoon', 0, ?), 
        ('night', 0, ?)
      ON DUPLICATE KEY UPDATE amount = 0;
    `;

    await db.query(resetSQL, [todayDate, todayDate, todayDate]);
    console.log("Daily reset: Initialized new day with zero intake.");
  } catch (error) {
    console.error("Error resetting daily intake:", error);
  }
});

// Redirect root (/) to log-intake
app.get("/", (req, res) => {
  res.redirect("/log-intake");
});

// Log Water Intake Route
app.get("/log-intake", (req, res) => {
  res.render("log-intake");
});

app.post("/log-intake", async (req, res) => {
  try {
    const { timeSlot, amount } = req.body;
    const recordedDate = new Date().toISOString().split("T")[0];

    if (!timeSlot || !amount) {
      return res.status(400).send("Error: Missing required fields.");
    }

    let sql = `
      INSERT INTO water_intake (time_slot, amount, recorded_date) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);
    `;

    await db.query(sql, [timeSlot, amount, recordedDate]);

    res.redirect("/summary");
  } catch (error) {
    console.error("Error inserting water intake:", error);
    res.status(500).send("Internal Server Error. Check logs for details.");
  }
});

// Summary Route - Displays Daily Intake
app.get("/summary", async (req, res) => {
  try {
    let sql = `
      SELECT time_slot, SUM(amount) as total 
      FROM water_intake 
      WHERE recorded_date = CURDATE() 
      GROUP BY time_slot
    `;

    const results = await db.query(sql);
    let intakeData = { morning: 0, afternoon: 0, night: 0, totalIntake: 0 };

    if (Array.isArray(results) && results.length > 0) {
      results.forEach((row) => {
        if (row.time_slot) {
          intakeData[row.time_slot] = Number(row.total);
          intakeData.totalIntake += Number(row.total);
        }
      });
    }

    res.render("summary", {
      morningIntake: intakeData.morning || 0,
      afternoonIntake: intakeData.afternoon || 0,
      nightIntake: intakeData.night || 0,
      totalIntake: intakeData.totalIntake || 0,
    });
  } catch (error) {
    console.error("Database error in /summary:", error);
    res.status(500).send("Internal Server Error. Check logs for details.");
  }
});

// Auto Cleanup - Deletes Records Older Than 7 Days
setInterval(async () => {
  try {
    let deleteSQL = `DELETE FROM water_intake WHERE recorded_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    await db.query(deleteSQL);
    console.log("Deleted old water intake records older than 7 days.");
  } catch (error) {
    console.error("Error deleting old records:", error);
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Start server on port 3000
app.listen(3000, () => {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
