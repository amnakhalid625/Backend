// require('dotenv').config({path:'./env'})   old version required and import are not the match so we use the second approach
import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';
dotenv.config({path:'./env'})

connectDB()
.then(()=>{
app.listen(process.env.PORT || 8000),()=>{
console.log(`app is listening on the port ${process.env.PORT}`);
app.on(error,(error)=>{
  console.log('error in the then part of the program *:',error);
  throw error;
  
})
}
})
.catch((error)=>{
  console.log('server failed to connect the mongoose database !!!',error);
  
})





/*
 const app=express()

;( async()=>{
    try {
      await  mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_Name}`)

      app.on('error',(error)=>{
        console.log('error',error);
        throw error
        
      })

     app.listen(process.env.PORT,()=>{
console.log(`app is lisning on the port:${process.env.PORT}`)
     })
        
    } catch (error) {
        console.error('ERROR',error);
        throw err
        
    }
})
    */