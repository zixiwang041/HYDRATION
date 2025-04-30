const express = require("express");
const schedule = require("node-schedule");
const session = require("express-session");
const db = require("./services/db");
const crypto = require("crypto");

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

// Routes
app.get("/", (req, res) => res.redirect("/log-intake"));

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Register GET
app.get("/register", (req, res) => {
  res.render("register");
});

// Register POST
app.post("/register", async (req, res) => {
  const { username, first, last, email, gender, password, repassword } =
    req.body;

  if (!username || !first || !last || !email || !gender || !password) {
    return res.status(400).send("All fields are required.");
  }

  if (password !== repassword) {
    return res.status(400).send("Passwords do not match.");
  }

  try {
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const sql = `
      INSERT INTO users (username, first_name, last_name, email, gender, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [username, first, last, email, gender, hash]);
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).send("Failed to register. Try a different username.");
  }
});

// Login GET
app.get("/login", (req, res) => {
  res.render("login");
});

// Login POST (username OR email)
// Login POST
app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).send("Missing login credentials.");
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  console.log("🔐 Login attempt with:", identifier, "Password hash:", hash);

  try {
    const results = await db.query(
      "SELECT * FROM users WHERE (username = ? OR email = ?) AND password_hash = ?",
      [identifier, identifier, hash]
    );

    console.log("🧾 Query result:", results);

    const user = results.length > 0 ? results[0] : null;

    if (!user) {
      console.log("❌ No matching user found.");
      return res.status(401).send("Invalid credentials.");
    }

    req.session.userId = user.id;
    req.session.name = user.username;
    res.redirect("/log-intake");
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).send("Login failed. Try again.");
  }
});

// Intake Form
app.get("/log-intake", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("log-intake", { name: req.session.name });
});

// Intake Submission
app.post("/log-intake", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { timeSlot, amount } = req.body;
  const userId = req.session.userId;
  const recordedDate = new Date().toISOString().split("T")[0];

  if (!timeSlot || !amount) {
    return res.status(400).send("Missing time slot or amount.");
  }

  const sql = `
    INSERT INTO water_intake (user_id, time_slot, amount, recorded_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
  `;

  try {
    await db.query(sql, [userId, timeSlot, amount, recordedDate]);
    res.redirect("/summary");
  } catch (error) {
    console.error("Intake error:", error.message);
    res.status(500).send("Could not save intake.");
  }
});

// Summary
app.get("/summary", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const results = await db.query(
      `SELECT time_slot, SUM(amount) as total 
       FROM water_intake 
       WHERE recorded_date = CURDATE() AND user_id = ?
       GROUP BY time_slot`,
      [req.session.userId]
    );

    console.log("📊 Raw query results:", results);

    let summary = { morning: 0, afternoon: 0, night: 0, totalIntake: 0 };

    for (const row of results) {
      const intake = Number(row.total); // ensure it's a number
      summary[row.time_slot] = intake;
      summary.totalIntake += intake;
    }

    res.render("summary", {
      name: req.session.name,
      ...summary,
    });
  } catch (error) {
    console.error("❌ Summary error:", error); // FULL error object
    res.status(500).send("Error generating summary.");
  }
});

// Cleanup old entries
setInterval(async () => {
  try {
    await db.query(
      `DELETE FROM water_intake WHERE recorded_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
    );
    console.log("Old intake records deleted.");
  } catch (error) {
    console.error("Cleanup error:", error.message);
  }
}, 24 * 60 * 60 * 1000);

// Start
app.listen(3000, () => {
  console.log("✅ Server running at http://127.0.0.1:3000");
});
