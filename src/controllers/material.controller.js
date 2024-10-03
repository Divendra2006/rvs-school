import { Material } from "../models/material.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const sendAllMaterials = asyncHandler(async(req,res)=>{
    // console.log("req.file :",req.file)
    // console.log("Incoming request:", req.body); // Log the body to see Class and subject
    // console.log("Uploaded file:", req.file); //
    
    const {Class,subject} = req.body;
    if(!Class && !subject){
        throw new ApiError(400,"Class and Subject fields are empty");
    
    }

    const fileLocalPath = req.file?.path

    if(!fileLocalPath){
        throw new ApiError(400,"file is required");

    }

    const file = await uploadOnCloudinary(fileLocalPath)

    if(!file){
        throw new ApiError(400,"file upload failed")

    }

    const material = await Material.create({
        Class,
        subject,
        file:file.url
    })

    const createdMaterial = await Material.findById(material._id)

    if(!createdMaterial){
        throw new ApiError(500,"something went wrong while registering the material")

    }

    return res.status(201).json(
        new ApiResponse(200 , createdMaterial , "material register successfully")
    )
})

const getAllMaterials = asyncHandler(async(req,res)=>{
    const {Class,subject} = req.query;
    try {
        const materials = await Material.find({Class,subject})
        console.log("Querying for materials:", { Class, subject });
        if (materials.length === 0) {
            return res.status(404).json({ message: 'No material found for the selected class and subject.' });
        }
        return res.status(200).json(materials.map(material => material.file));
        
    } catch (error) {
        throw new ApiError(500,"get all materials faied")
        
    }
})

export {sendAllMaterials,getAllMaterials}


