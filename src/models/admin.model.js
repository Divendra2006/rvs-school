import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"

const adminSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    accessToken:{
        type:String,
        
    },
    refreshToken:{
        type:String,
        
    }
})

adminSchema.pre("save",async function(next){
    if(!this.isModified("password"))
        return next(); 
    this.password= await bcrypt.hash(this.password,10)
    next()
})

adminSchema.methods.isPasswordCorrect = async function(password){
    console.log("provided password",password);
    console.log("Stored password Hash",this.password)
    if (!this.password) {
        throw new ApiError("Hashed password is missing");
    }
    return await bcrypt.compare(password,this.password)
}

adminSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
    })
}

adminSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
    }
)
}

export const Admin = mongoose.model("Admin",adminSchema);