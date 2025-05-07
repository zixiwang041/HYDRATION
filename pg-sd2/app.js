const express = require("express");
const schedule = require("node-schedule");
const session = require("express-session");
const db = require("./app/services/db");

const userRoutes = require("./app/routes/userRoutes");
const intakeRoutes = require("./app/routes/intakeRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", "./app/views");

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Check DB connection
async function testDatabaseConnection() {
  try {
    await db.query("SELECT 1");
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}
testDatabaseConnection();

// Ensure tables exist
async function ensureTablesExist() {
  try {
    const usersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(100),
        gender ENUM('male', 'female', 'other'),
        password_hash VARCHAR(255) NOT NULL
      )
    `;
    const intakeSQL = `
      CREATE TABLE IF NOT EXISTS water_intake (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        time_slot ENUM('morning', 'afternoon', 'night') NOT NULL,
        amount INT NOT NULL DEFAULT 0,
        recorded_date DATE NOT NULL,
        UNIQUE KEY unique_entry (user_id, time_slot, recorded_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await db.query(usersSQL);
    await db.query(intakeSQL);
    console.log("Tables ensured.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  }
}
ensureTablesExist();

// Reset intake daily at midnight
schedule.scheduleJob("0 0 * * *", async function () {
  try {
    const today = new Date().toISOString().split("T")[0];
    const resetSQL = `
      INSERT INTO water_intake (user_id, time_slot, amount, recorded_date)
      SELECT id, 'morning', 0, ? FROM users
      UNION
      SELECT id, 'afternoon', 0, ? FROM users
      UNION
      SELECT id, 'night', 0, ? FROM users
      ON DUPLICATE KEY UPDATE amount = 0;
    `;
    await db.query(resetSQL, [today, today, today]);
    console.log("Water intake reset for the new day.");
  } catch (error) {
    console.error("Reset error:", error);
  }
});

// Use modular routes
app.use("/", userRoutes);
app.use("/", intakeRoutes);

// Default route
app.get("/", (req, res) => res.redirect("/log-intake"));

// Handle 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
app.listen(3000, () => {
  console.log(" Server running at http://127.0.0.1:3000");
});
