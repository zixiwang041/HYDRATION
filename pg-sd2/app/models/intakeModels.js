const db = require("../services/db");

// Save or update intake for a specific date and time slot
exports.saveIntake = async (userId, timeSlot, amount, date) => {
  const sql = `
    INSERT INTO water_intake (user_id, time_slot, amount, recorded_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
  `;
  return db.query(sql, [userId, timeSlot, amount, date]);
};

// Get intake summary for today
exports.getDailySummary = async (userId) => {
  const sql = `
    SELECT time_slot, SUM(amount) AS total
    FROM water_intake
    WHERE recorded_date = CURDATE() AND user_id = ?
    GROUP BY time_slot
  `;
  const rows = await db.query(sql, [userId]);
  return rows;
};

// Get intake summary for the past 7 days (including today)
exports.getWeeklySummary = async (userId) => {
  const sql = `
    SELECT time_slot, SUM(amount) AS total
    FROM water_intake
    WHERE recorded_date >= CURDATE() - INTERVAL 6 DAY AND user_id = ?
    GROUP BY time_slot
  `;
  const rows = await db.query(sql, [userId]);
  return rows;
};

// Get user's daily hydration goal
exports.getGoal = async (userId) => {
  const sql = `SELECT daily_goal FROM users WHERE id = ?`;
  const rows = await db.query(sql, [userId]);
  return rows.length ? rows[0].daily_goal : 2000;
};
