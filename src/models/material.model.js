import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    Class:{
        type:Number,
        required:true,
    },
    subject:{
       type:String,
       required:true,
    },
    file:{
        type:String,

    }
})

export const Material = mongoose.model('Material',materialSchema);


