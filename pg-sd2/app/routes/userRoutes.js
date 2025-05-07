const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Auth
router.get("/login", userController.showLoginPage);
router.post("/login", userController.loginUser);
router.get("/register", userController.showRegisterPage);
router.post("/register", userController.registerUser);
router.get("/logout", userController.logoutUser);

// Profile
router.get("/profile", userController.showProfilePage);
router.post("/profile", userController.updateProfile);
router.get("/change-password", userController.showChangePasswordPage);
router.post("/change-password", userController.changePassword);
router.post("/update-goal", userController.updateGoal);

module.exports = router;
