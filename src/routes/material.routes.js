import {Router} from "express"
import { getAllMaterials, sendAllMaterials } from "../controllers/material.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()


router.route("/material/upload").post(upload.single("file"),sendAllMaterials)
router.route("/material").get(getAllMaterials)

export default router