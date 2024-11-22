class ApiError extends  Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message);       // Call the parent class constructor with the message
        this.statusCode=statusCode;
        this.data=null;
        this.message=message;
        this.success=false;
        this.errors=errors  ;  // Assign the passed errors array
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}