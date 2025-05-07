const crypto = require("crypto");
const db = require("../services/db");

// Show login page
exports.showLoginPage = (req, res) => {
  try {
    res.render("login", { title: "Login", error: null, identifier: "" });
  } catch (err) {
    console.error("Login page render error:", err);
    res.status(500).send("Error displaying login page.");
  }
};

// Handle login
exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.render("login", {
      title: "Login",
      error: "Please fill in all fields.",
      identifier,
    });
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  try {
    const sql = `SELECT id, username FROM users WHERE (username = ? OR email = ?) AND password_hash = ?`;
    const rows = await db.query(sql, [identifier, identifier, hash]);

    if (rows.length > 0) {
      req.session.userId = rows[0].id;
      req.session.name = rows[0].username;
      return res.redirect("/log-intake");
    }

    res.render("login", {
      title: "Login",
      error: "Invalid username or password.",
      identifier,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed.");
  }
};

// Show register page
exports.showRegisterPage = (req, res) => {
  res.render("register", {
    title: "Register",
    error: null,
    username: "",
    first: "",
    last: "",
    email: "",
    gender: "",
  });
};

// Handle registration
exports.registerUser = async (req, res) => {
  const { username, first, last, email, password, repassword, gender } =
    req.body;

  if (
    !username ||
    !first ||
    !last ||
    !email ||
    !password ||
    !repassword ||
    !gender
  ) {
    return res.render("register", { error: "All fields are required." });
  }

  if (password !== repassword) {
    return res.render("register", { error: "Passwords do not match." });
  }

  const name = `${first} ${last}`;
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  try {
    const sql = `INSERT INTO users (username, password_hash, name, email, gender) VALUES (?, ?, ?, ?, ?)`;
    await db.query(sql, [username, hash, name, email, gender]);
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Registration failed.");
  }
};

// Logout
exports.logoutUser = (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
};

// Show profile
exports.showProfilePage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const sql = `SELECT username, name, email, gender, daily_goal FROM users WHERE id = ?`;
    const rows = await db.query(sql, [req.session.userId]);
    const user = rows[0];

    res.render("profile", {
      user,
      successMessage: req.session.successMessage || null,
    });

    delete req.session.successMessage;
  } catch (err) {
    console.error("Profile load error:", err);
    res.status(500).send("Profile error.");
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { name, email, gender } = req.body;

  if (!name || !email || !gender) {
    return res.render("profile", { error: "All fields are required." });
  }

  try {
    const sql = `UPDATE users SET name = ?, email = ?, gender = ? WHERE id = ?`;
    await db.query(sql, [name, email, gender, req.session.userId]);
    req.session.successMessage = "Profile updated!";
    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("Update failed.");
  }
};

// Show change password page
exports.showChangePasswordPage = (req, res) => {
  res.render("change-password", { error: null, success: null });
};

// Handle password change
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render("change-password", { error: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.render("change-password", { error: "Passwords do not match." });
  }

  try {
    const hashCurrent = crypto
      .createHash("sha256")
      .update(currentPassword)
      .digest("hex");
    const sql = `SELECT password_hash FROM users WHERE id = ?`;
    const rows = await db.query(sql, [req.session.userId]);

    if (!rows.length || rows[0].password_hash !== hashCurrent) {
      return res.render("change-password", {
        error: "Incorrect current password.",
      });
    }

    const newHash = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");
    await db.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
      newHash,
      req.session.userId,
    ]);

    res.render("change-password", {
      success: "Password updated successfully!",
    });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).send("Password update failed.");
  }
};

// Update hydration goal
exports.updateGoal = async (req, res) => {
  const { dailyGoal } = req.body;
  const goal = parseInt(dailyGoal);

  if (isNaN(goal) || goal < 500) {
    return res.render("profile", { error: "Goal must be at least 500ml." });
  }

  try {
    await db.query(`UPDATE users SET daily_goal = ? WHERE id = ?`, [
      goal,
      req.session.userId,
    ]);
    req.session.successMessage = "Hydration goal updated!";
    res.redirect("/profile");
  } catch (err) {
    console.error("Hydration goal error:", err);
    res.status(500).send("Hydration goal update failed.");
  }
};
