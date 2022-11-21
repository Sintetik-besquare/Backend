const jwt = require('jsonwebtoken')
const { queryByPromise } = require('../dbconfig/db');
const fs = require('fs');
const path =require('path');
const publicKey = fs.readFileSync(path.join(__dirname,"../jwt_certs/public.pem"), "utf8" );
const {decrypt} = require('../utils/crypto');

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
        let {client_id} = jwt.verify(token, publicKey, { expiresIn: "1d", algorithm:'RS256' });
        client_id = decrypt(client_id);
        
        //check thether the user_id exist 
        //req.user attach user_id into the req.body for the next request function
        const my_query = {
            text:
            `select client_id from client.account where client_id=$1;`,
            values:[client_id]
          }
        const id = await queryByPromise(my_query); 
        req.user = id.result[0].client_id
      
        //go to next handler function
        next(); 

    }catch(error){
        console.log(error);
        return res.status(401).json({ errors: "Request is not authorized" });
    };
    
} 

module.exports = requireAuth;