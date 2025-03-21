require("dotenv").config();

const mysql = require("mysql2/promise");

const config = {
  db: {
    host: process.env.DB_CONTAINER || "db", // Ensure it's correct
    port: process.env.DB_PORT || 3306, // Default MySQL port
    user: process.env.MYSQL_ROOT_USER || "root",
    password: process.env.MYSQL_ROOT_PASSWORD || "password",
    database: process.env.MYSQL_DATABASE || "hydration_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
};

const pool = mysql.createPool(config.db);

// Utility function to query the database
async function query(sql, params) {
  const [rows, fields] = await pool.execute(sql, params);

  return rows;
}

module.exports = {
  query,
};
