import express from "express";
import {
  userAccountDeletion,
  banUserFromPlatform,
  getAllUsers,
  getDeletedAccounts,
  getTotalUsers,
  getSingleUser,
  makeAdmin,
  removeAdmin,
  restoreBannedUserToPlatform,
  makeEmployee,
  removeEmployee,
} from "../controllers/userController.js";
import {
  authenticate,
  authorizeAdmin,
  authorizeAdminOrEmployee,
} from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/allUsers", authenticate, authorizeAdminOrEmployee, getAllUsers);

router.get(
  "/getDeletedAccounts",
  authenticate,
  authorizeAdmin,
  getDeletedAccounts,
);
router.get(
  "/get-total-users",
  authenticate,
  authorizeAdminOrEmployee,
  getTotalUsers,
);
router.patch("/delete-my-account", authenticate, userAccountDeletion);
router.get(
  "/single-user/:id",
  authenticate,
  authorizeAdminOrEmployee,
  getSingleUser,
);
router.patch(
  "/ban-user-from-platform/:id",
  authenticate,
  authorizeAdmin,
  banUserFromPlatform,
);
router.patch(
  "/restore-banned-user-to-platform/:id",
  authenticate,
  authorizeAdmin,
  restoreBannedUserToPlatform,
);
router.patch("/makeAdmin/:id", authenticate, authorizeAdmin, makeAdmin);
router.patch("/removeAdmin/:id", authenticate, authorizeAdmin, removeAdmin);
router.patch("/makeEmployee/:id", authenticate, authorizeAdmin, makeEmployee);
router.patch(
  "/removeEmployee/:id",
  authenticate,
  authorizeAdmin,
  removeEmployee,
);

export default router;
