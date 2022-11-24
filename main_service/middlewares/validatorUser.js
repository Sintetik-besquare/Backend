const { queryByPromise } = require("../dbconfig/db");
const { body } = require('express-validator');
const bcrypt = require("bcrypt");
  signupValidation= [
    body('email')
    .not().isEmpty().withMessage("Email cannot be empty").bail()
    .isEmail().withMessage("Invalid email format").bail()
    .custom(async(email)=>{
      const my_query = {
        text:
        `select * from client.account where email=$1;`,
        values:[email]
      };
      const user_email = await queryByPromise(my_query);
                if(user_email.result.length !== 0){
                    return Promise.reject('Duplicated email');
                };
    }),

    body('password')
    .not().isEmpty().withMessage("Password cannot be empty").bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
  })
  .withMessage("Password must be greater than 8 and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol").bail()
  .custom(password => !/\s/.test(password)).withMessage('No spaces are allowed in the password'),

  body("confirm_password")
  .not().isEmpty().withMessage("Password cannot be empty").bail()
  .custom((password,{req})=>{
      if(password!==req.body.password){
          throw new Error('Password confirmation does not match');
      }
      return true;
  })

  ];

  loginValidation= [
    body('email')
    .not().isEmpty().withMessage("Email cannot be empty").bail()
    .isEmail().withMessage("Invalid email").bail()
    .custom(async(email)=>{
      const my_query = {
        text:
        `select * from client.account where email=$1;`,
        values:[email]
      }
      const user_email = await queryByPromise(my_query);
                if(user_email.result.length === 0){
                    return Promise.reject('Invalid email');
                };
    }),

    body('password')
    .not().isEmpty().withMessage("Password cannot be empty").bail()
    .custom(async(password,{ req })=>{
    try{
      const my_query = {
        text:
        `SELECT password FROM client.account WHERE email=$1;`,
        values:[req.body.email]
      };
      const hash_password = await queryByPromise(my_query);
      const user_hash_password = hash_password.result[0].password;
      const match = await bcrypt.compare(password, user_hash_password);

      if (!match) {
        return Promise.reject('Invalid password');
      };
      
      }catch(error)
      {
        return Promise.reject('Invalid password');
      }
      

    })
  ];

  sendPasswordLinkValidation=[
    body('email')
    .not().isEmpty().withMessage("Email cannot be empty").bail()
    .isEmail().withMessage("Invalid email format").bail()
    .custom(async(email)=>{
      const my_query={
        text:`select * from client.account where email=$1;`,
        values:[email]
      }
      const user_email = await queryByPromise(my_query);
                if(user_email.result.length === 0){
                    return Promise.reject('Email does not exist');
                };
    }),
  ];

  resetPasswordValidation=[
      body("password")
      .not().isEmpty().withMessage("Password cannot be empty").bail()
      .isStrongPassword({
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
      })
      .withMessage("Password must be greater than 8 and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol").bail()
      .custom(password => !/\s/.test(password)).withMessage('No spaces are allowed in the password'),
      
      body("confirm_password")
      .not().isEmpty().withMessage("Password cannot be empty").bail()
      .custom((password,{req})=>{
          if(password!==req.body.password){
              throw new Error('Password confirmation does not match');
          }
          return true;
      })
  ];

  module.exports = {
    signupValidation,
    loginValidation,
    sendPasswordLinkValidation,
    resetPasswordValidation
  }

 