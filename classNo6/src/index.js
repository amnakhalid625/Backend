// require('dotenv').config({path:'./env'})   old version required and import are not the match so we use the second approach
import dotenv from 'dotenv'
import connectDB from './db/index.js';
dotenv.config({path:'./env'})

connectDB()





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