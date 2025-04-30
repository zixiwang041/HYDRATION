-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
-- Host: db
-- Generation Time: Oct 30, 2022 at 09:54 AM
-- Server version: 8.0.24
-- PHP Version: 7.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Charset setup
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
 /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
 /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 /*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

-- 🧠 DATABASE: hydration
CREATE DATABASE IF NOT EXISTS hydration;
USE hydration;

-- --------------------------------------------------------
-- 🚰 TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- --------------------------------------------------------
-- 💧 TABLE: water_intake
CREATE TABLE IF NOT EXISTS water_intake (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  time_slot ENUM('morning', 'afternoon', 'night') NOT NULL,
  amount INT NOT NULL,
  recorded_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 🧪 TABLE: test_table (original)
CREATE TABLE IF NOT EXISTS test_table (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(512) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert test data
INSERT INTO test_table (id, name) VALUES
(1, 'Lisa'),
(2, 'Kimia');

-- Set auto-increment for test_table
ALTER TABLE test_table MODIFY id int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

COMMIT;

-- Charset reset
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
 /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
 /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
