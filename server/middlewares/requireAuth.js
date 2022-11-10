const jwt = require('jsonwebtoken')
const { queryByPromise } = require('../dbconfig/db');

const requireAuth = async (req, res, next) => {

    //verify authentication
    const{authorization} = req.headers;

    if(!authorization){
        return res.status(401).json({ errorMessage: "Authorization token required" });
    };

    //get token from req header
    const token = authorization.split(" ")[1];

    try{
        //get user_id from payload 
        const {client_id} = jwt.verify(token, process.env.SECRET);
        //check thether the user_id exist 
        //req.user attach user_id into the req.body for the next request function
        
        const id = await queryByPromise(
            `select client_id from client.account where client_id='${client_id}'`); 
        req.user = id.result[0].client_id
      
        //go to next handler function
        next(); 

    }catch(error){
        return res.status(401).json({ errorMessage: "Request is not authorized" });
    };
    
} 

module.exports = requireAuth;