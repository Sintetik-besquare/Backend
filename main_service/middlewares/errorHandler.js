const errorHandler = (error,req,res,next) => {
   return res.status(error.status || 500).json({errors: error.message || "Internal server error"});
}


module.exports=errorHandler;