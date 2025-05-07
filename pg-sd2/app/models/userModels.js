exports.getSummary = async (userId) => {
  const sql = `SELECT time_slot, SUM(amount) as total
                 FROM water_intake
                 WHERE recorded_date = CURDATE() AND user_id = ?
                 GROUP BY time_slot`;
  return db.query(sql, [userId]);
};
