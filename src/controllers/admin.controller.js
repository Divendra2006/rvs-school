import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


const generateAccessandRefreshTokens = async(adminId)=>{
    try {
        const admin = await Admin.findById(adminId)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()
        admin.refreshToken = refreshToken
        await admin.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token")
    }

}


const registerAdmin = asyncHandler(async(req,res)=>{
    const {fullName,email,password} = req.body;

    if([fullName,email,password].some((field)=>{
        return field?.trim()==="";
    })){
        throw new ApiError(400,"All Fields are required")
    }

    const existedAdmin = await Admin.findOne({
        $or:[{email}]
    })

    if(existedAdmin){
        throw new ApiError(400,"Admin with email are already exist")
    }

    const admin = await Admin.create({
        fullName,
        email,
        password,
    })

    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    if(!createdAdmin){
        throw new ApiError(500,"something went wrong while registering the admin")

    }

    return res.status(201).json(
        new ApiResponse(200,createdAdmin,"User registered successfully")
    )
})

const loginAdmin = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
    if(!email){
        throw new ApiError(400,"email is required")
    }

    const admin = await Admin.findOne({
        $or:[{email}]
    });

    if(!admin){
        throw new ApiError(400,"admin not found")
    }

    const isPasswordValid = await admin.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(400,"incorrect password")
    }

    const {accessToken,refreshToken} = await generateAccessandRefreshTokens(admin._id)
    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    const options={
        httpOnly : true,
        secure :true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            admin: loggedInAdmin,accessToken,refreshToken
        },
        "Admin loggedIn successfully"
    )
    )

    
})

export {
    registerAdmin,
    loginAdmin,
}