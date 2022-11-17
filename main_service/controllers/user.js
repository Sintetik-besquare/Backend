require('dotenv').config();
const { queryByPromise } = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/send_email');
const crypto = require("crypto");
const env = process.env;
const fs = require('fs');
const path =require('path');
const { encrypt } = require('../utils/crypto');
const privateKey = fs.readFileSync(path.join(__dirname,"../jwt_certs/private.pem"), "utf8" );

const createToken = (client_id) => {
  client_id =encrypt(client_id);
  return jwt.sign({ client_id }, privateKey, { expiresIn: "1d", algorithm:'RS256' });
};

const userController = {
  //login user 
  loginUser: async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

    //get user id
    const my_query = {
      text:
      `SELECT client_id FROM client.account WHERE email=$1;`,
      values:[email]
    };
    const user_id = await queryByPromise(my_query);

    //create token
    const token = createToken(user_id.result[0].client_id);

    return res.status(200).json({
      status: true,
      message: "login successfully!",
      token: token,
    });
  },
  //signup user
  signupUser: async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

    //hash the password before storing it into the db
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const initial_balance = 20000.00;
    const date_join = Math.floor(Date.now()/1000);

    //store user email & password to db
    const my_query = {
      text:
      `INSERT INTO client.account (email, password, balance, date_join) 
      VALUES($1,$2,$3,$4);`,
      values:[email,hash,initial_balance,date_join]
    };
    await queryByPromise(my_query);

    //get user id
    const my_query2 = {
      text:
      `SELECT client_id FROM client.account WHERE email=$1;`,
      values:[email]
    };
    const user_id = await queryByPromise(my_query2);

    //create token
    const token = createToken(user_id.result[0].client_id);
    return res.status(200).json({
      status: true,
      message: "signup successfully!",
      token: token,
    });
  },
  sendPasswordLink: async (req, res) => {
    try{
    const {email} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

    //get client id 
    const my_query={
      text:`SELECT client_id FROM client.account WHERE email=$1;`,
      values:[email]
    };
    const client_id = await queryByPromise(my_query);

    //create token
    const token = crypto.randomBytes(32).toString("hex");

    //token created time
    const created_time = Math.floor(Date.now()/1000);

    //token expired time
    const expired_time = created_time + 3600;

    //store token into db
    const my_query2={
      text:`INSERT INTO client.resetPassword (client_id, token, created_at, expired_at)
      VALUES($1,$2,$3,$4) 
      RETURNING id;`,
      values:[client_id.result[0].client_id,token,created_time,expired_time]
    };
    const id = await queryByPromise(my_query2);
    
    //send email
    const link = `${env.EMAIL_BASE_URL}/password-reset/${id.result[0].id}/${token}`;
    await sendEmail(email,"Password Reset", link );
    
    return res.status(200).json({
      status: true,
      message: "Password reset link has sent to your email account",
    });
    }catch(error){
      console.log(error);
      return res.status(400).json({
        status: false,
        message: "Error occured",
      });
    } 
    
  },
  resetPassword: async (req, res) => {
    try{
      const {userId,token} = req.params;
      const {password, confirm_password} = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      };

    //check whether link is valid
    const my_query={
      text:`SELECT client_id, expired_at FROM client.resetPassword 
      WHERE id=$1 AND token=$2;`,
      values:[userId,token]
    }
    const check = await queryByPromise(my_query);

    let current_time = Math.floor(Date.now()/1000) ;
    
    if(check.result.length === 0 || current_time > check.result[0].expired_at){
      return res.status(400).json({
        status: false,
        message: "Invalid link or expired",
      });
    };

     //hash new password if everything is fine
     const salt = await bcrypt.genSalt(10);
     const new_hash = await bcrypt.hash(password, salt);
  
     //reset user password
     const my_query2 = {
       text:
       `UPDATE client.account SET password = $1 WHERE client_id= $2;`,
       values:[new_hash,check.result[0].client_id]
     };
     await queryByPromise(my_query2);

     //after reset password delete token
     const my_query3 = {
      text:
      `DELETE FROM client.resetPassword WHERE id= $1 AND token=$2;`,
      values:[userId,token]
    };
    await queryByPromise(my_query3);

    return res.status(200).json({
      status: true,
      message: "Successfully reset password",
    });

    }catch(error){
      console.log(error);
      return res.status(400).json({
        status: false,
        message: "Error occured",
      });
    }
    
  }

};

//forget password

module.exports = userController;