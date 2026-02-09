import express from "express";
import {
  checkCookie,
  login,
  logoutCurrentUser,
  signUp,
  googleLogin,
  adminLogin,
} from "../controllers/authController.js";
const router = express.Router();

router.get("/check", checkCookie);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/sign-up", signUp);
router.post("/google", googleLogin);
router.post("/logout", logoutCurrentUser);

export default router;
