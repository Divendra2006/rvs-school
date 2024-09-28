import { Router } from "express";
import { changeCurrentPssword, getCurrentStudent, loginStudent, logoutStudent, refreshAccessToken, registerStudent, updateAccountDetails } from "../controllers/student.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        }
    ]),
    registerStudent)


router.route("/login").post(loginStudent)
router.route("/logout").post(verifyJWT,logoutStudent)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPssword)
router.route("/current-student").post(verifyJWT,getCurrentStudent)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)


export default router