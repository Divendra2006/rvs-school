import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new Schema({
    fullName:{
        type:String,
        required:true,
    },
    Rollno:{
        type:Number,
        required:true,
          
    },
    email:{
        type:String,
    
    },
    Class:{
        type:Number,
        required: true,
    },
    password:{
        type:String,
        required:[true,"Password is required"],
    },
    avatar:{
        type:String,
    },
    refreshToken:{
        type:String,

    },
    accessToken:{
        type:String,

    }
},{
    timestamps:true
})

studentSchema.pre("save",async function(next){
    if(!this.isModified("password"))
        return next(); 
    this.password= await bcrypt.hash(this.password,10)
    next()
})

studentSchema.methods.isPasswordCorrect = async function(password){
    console.log("provided password",password);
    console.log("Stored password Hash",this.password)
    if (!this.password) {
        throw new Error("Hashed password is missing");
    }
    return await bcrypt.compare(password,this.password)
}

studentSchema.methods.generateAccessToken = function(){
   
    return jwt.sign({
        _id : this._id,
        email:this.email,
        fullName:this.fullName,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
           expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

studentSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
        
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
           expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const Student = mongoose.model("Student",studentSchema)