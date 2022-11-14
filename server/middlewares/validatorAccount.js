const { queryByPromise } = require("../dbconfig/db");
const { body } = require('express-validator');
const bcrypt = require("bcrypt");

resetBalanceValidation = [
    body("reset_balance")
    .not().isEmpty().withMessage("Invalid action").bail()
    .isIn(["true"]).withMessage("Invalid action")
];

resetPasswordValidation = [
    body("old_password")
    .not().isEmpty().withMessage("Password cannot be empty").bail()
    .isLength({ min: 8 }).withMessage("Invalid Password").bail()
    .custom(async (password,{req})=>{
        //get old hash password and use bcrypt to compare
        const user_hash_password = await queryByPromise(
        `SELECT password FROM client.account WHERE client_id='${req.user}'`);
        //compare the hash password with old password
        const match = await bcrypt.compare(
        password,
        user_hash_password.result[0].password
      );

      if (!match) {
        throw new Error('Invalid password');
      }
      return true;
    }),

    body("new_password")
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
    
    body("new_password_confirmation")
    .not().isEmpty().withMessage("Password cannot be empty").bail()
    .custom((password,{req})=>{
        if(password!==req.body.new_password){
            throw new Error('Password confirmation does not match');
        }
        return true;
    })

];

userDetailsValidation = [
    body("firstname")
    .optional({ checkFalsy: true })
    .isString().withMessage("Firstname must be a string").bail()
    .isLength({ max: 255 }).withMessage("Maximum length equal to 255"),

    body("lastname")
    .optional({ checkFalsy: true })
    .isString().withMessage("Lastname must be a string").bail()
    .isLength({ max: 255 }).withMessage("Maximum length equal to 255"),

    body("gender")
    .optional({ checkFalsy: true })
    .isString().withMessage("gender must be a string").bail()
    .isIn(["Female","Male"]).withMessage("Gender can only have Female or Male"),

    //Todo:add isIn 
    body("residence")
    .optional({ checkFalsy: true })
    .isString().withMessage("Residence must be a string").bail(),

     //Todo:add isIn 
    body("occupation")
    .optional({ checkFalsy: true })
    .isString().withMessage("Occupation must be a string").bail(),

    body("age")
    .optional({ checkFalsy: true })
    .isInt({min:18, max:99}).withMessage("Age must between 18 to 99"),

    body("education")
    .optional({ checkFalsy: true })
    .isString().withMessage("Education must be a string").bail()
    .isIn(["Elementary","Secondary","Tertiary","Others"]).withMessage("Education can have Elementary,Secondary,Tertiary and others")
]

module.exports={
    resetBalanceValidation,
    resetPasswordValidation,
    userDetailsValidation
}