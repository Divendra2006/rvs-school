import { Student } from "../models/student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshTokens = async(studentId)=>{
   try {
      const student = await Student.findById(studentId)
      const accessToken = student.generateAccessToken()
      // console.log("generateAccessToken",accessToken)
      const refreshToken = student.generateRefreshToken()
      // console.log("loda",refreshToken)
      student.refreshToken = refreshToken
      await student.save({validateBeforeSave: false})
      return {accessToken,refreshToken};

   } catch (error) {
      throw new ApiError(500,"something went wrong while generating access and refresh token")
   }
}

const registerStudent = asyncHandler(async(req,res)=>{
   
   const {fullName,email,password,Rollno,Class} = req.body;
   
   if (
      [fullName,password,Rollno,Class].some((field)=>{
         return field?.trim()==="";
      })
   ) {
      throw new ApiError(400,"All Fields are required")
      
   }

   const existedStudent = await Student.findOne({
      $or:[{Rollno}]
   })

   if(existedStudent){
      throw new ApiError(409,"student with email or rollno already register")
   }

   // const avatarLocalPath = req.files?.avatar[0]?.path;
   // if(!avatarLocalPath){
   //    throw new ApiError(409,"avatar file is not present")
   // }

   // const avatar = await uploadOnCloudinary(avatarLocalPath)
   // if(!avatar){
   //    throw new ApiError(400, "avatar upload failed");
   // }

   const student = await Student.create({
      fullName,
      // avatar: avatar.url,
      email,
      password,
      Class,
      Rollno,
   })

   const createdStudent = await Student.findById(student._id).select("-password -refreshToken")

   if(!createdStudent){
      throw new ApiError(500,"something went wrong while registering the user")
    }

   return res.status(201).json(
      new ApiResponse(200, createdStudent, "User registered successfully")
  );

})


const loginStudent = asyncHandler(async(req,res)=>{

   const {Rollno,password} = req.body;
   console.log(req.body)

   if(!Rollno){
      throw new ApiError(400,"rollno is required")
   }

   const student = await Student.findOne({
      $or: [{Rollno}]
   });

   if(!student){
      throw new ApiError(400,"student does not exit");
   }

   const isPasswordValid = await student.isPasswordCorrect(password);

   if(!isPasswordValid){
      throw new ApiError(400,"incorrect password")
   }

   const {accessToken,refreshToken} = await generateAccessandRefreshTokens(student._id)
   const loggedInStudent = await Student.findById(student._id).select("-password -refreshToken") 

   const options = {
      httpOnly : true,
      secure: true,
   }

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,
         {
            student: loggedInStudent , accessToken ,refreshToken
         },
         "student loggedin successfully"
      )
   )

})


const logoutStudent = asyncHandler(async(req,res)=>{
   await Student.findByIdAndUpdate(
      req.user?._id,
      {
         $unset:{
            refreshToken:1
         }
      },
      {
         new:true
      }
   );

   const options = {
      httpOnly:true,
      secure:true,
   }

   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
  
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
   if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized request")
   }

   // console.log("Incoming refresh token", incomingRefreshToken)


   try {

      const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

      const student = await Student.findById(decodedToken?._id);


      if(!student){
         throw new ApiError(401,"Invalid refresh Token")
      }
      // console.log(student.refreshToken)
      if(incomingRefreshToken !== student?.refreshToken){
         throw new ApiError(401,"Refresh Token is expired")
      }
      // console.log("hello")
      const options = {
         httpOnly:true,
         secure:true
      }
      
      const {accessToken,newRefreshToken} = await generateAccessandRefreshTokens(student._id)
      return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
      
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
    console.log(req.body)
    const student = await Student.findById(req.student?._id).select('+password')

    if(!student){
      throw new ApiError(404,"student not found")
    }
    
    const isPasswordCorrect = await student.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old Password")
    }

    student.password = newPassword
    await student.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentStudent = asyncHandler(async(req,res)=>{
   return res.status(200)
   .json(200,req.user,"current user fetched successfully")
}) 

const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {fullName,email,Rollno} = req.body;
   
   if(!Rollno){
      throw new ApiError(400,"All fields are required")
   }

   const student = await Student.findByIdAndUpdate(
      req.student?._id,
      {
         $set:{
            fullName,
            email:email,
            Rollno
         }
      },
      {new:true}
   ).select("-password")

   return res.status(200).json(new ApiResponse(200,student,"account details updated successfully"))
})


export {
   registerStudent,
   loginStudent,
   logoutStudent,
   refreshAccessToken,
   changeCurrentPssword,
   getCurrentStudent,
   updateAccountDetails,

}