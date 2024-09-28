import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret,
});
const uploadOnCloudinary = async(localFilePath) =>{
    try{
         if(!localFilePath) return null
         // upload the file on cloudinary
         const response = await cloudinary.uploader
         .upload(localFilePath,{
         resource_type:"auto"
         }
       ) 
    //    file has been uploadeed successfully
        //  console.log("file is uploaded successfully")
        //  console.log(response.url)
        fs.unlinkSync(localFilePath)
         return response;

    } catch(error){
        fs.unlinkSync(localFilePath)
        // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}