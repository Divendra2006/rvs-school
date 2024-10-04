import { Router } from "express";
import { adminDeleteAccount, changeCurrentPssword, getCurrentAdmin, loginAdmin, logoutAdmin, refreshAccessToken, registerAdmin, updateAccountDetails } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/admin.auth.middleware.js";

const router = Router();

router.route("/register").post(registerAdmin)
router.route("/login").post(loginAdmin)
router.route("/logout").post(verifyJWT,logoutAdmin)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPssword)
router.route("/current-admin").get(verifyJWT,getCurrentAdmin)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/forget-password").post(adminDeleteAccount);

export default router