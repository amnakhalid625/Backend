// two way to create utility first one is mostly used in the production grader and second one is often used

const asyncHandler=()=>{
    (req,res,nex)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}









// const asyncHandler=(func)=> async (req,res,next)=>{
//     try {
//         await func(req,res,next)
//     } catch (error) {
// res.status(err.code ||500).json({
//     success:false,
//     message: err.message

// })        
//     }

// }

// export {asyncHandler};