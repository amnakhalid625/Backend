import mongoose from 'mongoose'
import express from 'express'
const app =express()
import { DB_NAME } from '../constant.js'



const connectDB=async ()=>{

try {
 const connectionInstance=   await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)
    console.log(`\n connect mongoose database !!! DB_HOST:${connectionInstance.connection.host}`)

} catch (error) {
    console.log('error is here connection mongodb:',error);
    process.exit(1)
    
}

}

export default connectDB;