import express from "express";
import {
  checkCookie,
  login,
  logoutCurrentUser,
  signUp,
} from "../controllers/authController.js";
const router = express.Router();

router.get("/check", checkCookie);
router.post("/login", login);
router.post("/sign-up", signUp);
router.post("/logout", logoutCurrentUser);

export default router;
