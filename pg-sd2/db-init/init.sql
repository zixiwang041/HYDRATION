CREATE DATABASE IF NOT EXISTS hydration;
USE hydration;

CREATE TABLE IF NOT EXISTS water_intake (
  id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot ENUM('morning', 'afternoon', 'night') NOT NULL,
  amount INT NOT NULL,
  recorded_date DATE NOT NULL
);
