import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { Admin } from "../models/admin.model.js";

const verifyJWT = asyncHandler(async(req,res,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new ApiError(400,"token not found")
    }

    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken")

        if(!admin){
            throw new ApiError(400,"Invalid Access Token")
        }

        req.admin = admin;
        next()
    } catch (error) {
        throw new ApiError(400,"invalid token")
    }
})

export {verifyJWT}