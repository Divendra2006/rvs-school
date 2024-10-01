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

const logoutAdmin = asyncHandler(async(req,res)=>{
    await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken ||req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(400,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const admin = await Admin.findById(decodedToken?._id);

        if(!admin){
            throw new ApiError(400,"invalid refresh token")
        }

        if(incomingRefreshToken !== admin?.refreshToken){
            throw new ApiError(400,"Refresh token is expired")
        }
 
        const options = {
            httpOnly:true,
            secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessandRefreshTokens(admin._id)
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
        )

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Refresh token has expired");
        } else if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid refresh token");
        } else {
          console.log("error",error)
            throw new ApiError(500, "An error occurred while refreshing the token");
        }
    }
})

const changeCurrentPssword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const admin = await Admin.findById(req.admin?._id).select('+password')

    if(!admin){
        throw new ApiError(400,"Admin not found")
    }

    const isPasswordCorrect = await admin.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")
    }

    admin.password = newPassword

    await admin.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentAdmin = asyncHandler(async(req,res)=>{
    return res.status(200).json({ admin: req.admin, message: "current admin fetched successfully" });
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;
    if(!email){
        throw new ApiError(400,"All fields are required")
    }

    const admin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,admin,"account details updated successfully"))
})


export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    refreshAccessToken,
    changeCurrentPssword,
    getCurrentAdmin,
    updateAccountDetails,

}