import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
 
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: '50mb'}))   
app.use(express.urlencoded({extended:true,limit:"50mb"}))
app.use(express.static("public"))
app.use(cookieParser())

import studentRouter from './routes/student.routes.js'
import materialRouter from './routes/material.routes.js'
import adminRouter from './routes/admin.routes.js'

app.use("/api/v1/students",studentRouter)
app.use("/api/v1",materialRouter)
app.use("/api/v1/admin",adminRouter)


export {app}
