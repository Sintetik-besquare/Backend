const { queryByPromise } = require('../dbconfig/db');
const bcrypt = require('bcrypt');
const validator =require('validator');
const jwt = require('jsonwebtoken');

const createToken= (user_id)=>{
    return jwt.sign({user_id},process.env.SECRET,{expiresIn:'3d'})
};

const userController = {
    //login user
    loginUser: async (req,res)=>{
        const {email,password} = req.body;

        //validation
        let errors = {};
        let errorMessage ='';
        let isBodyValid = true;

        //check empty field
        if(!email || !password){
            isBodyValid = false;
            errors['email'] = "Email cannot be empty";
            errors['password'] = "Password cannot be empty";
        };
        
        //check whether the email exist
         const check = {
            text: "select * from users.credential where email=$1",
            values: [email]
        };
        const user_email = await queryByPromise(check);
        if (user_email.result.length===0) {
            isBodyValid = false;
            errors['email'] = "Incorrect email";
            return res.status(400).json({
                sucess: false,
                errorMessage: 'Please enter a valid input',
                errors 
            });
        };

        
        //get user's hashed password
         const newUserCredential = await queryByPromise(
            `select * from users.credential where email='${email}'`);
        const hashPassword = newUserCredential.result[0].password;
        //matching password
        const match = await bcrypt.compare(password, hashPassword)

        if(!match){
            isBodyValid = false;
            errors['password'] = "Incorrect password";
        }

        //if got error respond with error 
        if(!isBodyValid){
            return res.status(400).json({
                sucess: false,
                errorMessage: 'Please enter a valid input',
                errors 
            });
        };

        //get user id
        const UserCredential = await queryByPromise(
            `select * from users.credential where email='${email}'`);
        const user_id = UserCredential.result[0].user_id;

        //create token
        const token = createToken(user_id);

        return res.status(200).json({status: true, message:"login successfully!",email:email, token:token});

    },
    //signup user
    signupUser: async (req,res)=>{
        const {email,password} = req.body;

        //validation
        let errors = {};
        let errorMessage ='';
        let isBodyValid = true;

        //check empty field
        if(!email || !password){
            isBodyValid = false;
            errors['email'] = "Email cannot be empty";
            errors['password'] = "Password cannot be empty";
        };
        //check email format
        if(!validator.isEmail(email)){
            isBodyValid = false;
            errors['email'] = "Email is not valid";
        };
        //check password strength
        if(!validator.isStrongPassword(password)){
            isBodyValid = false;
            errors['password'] = "Password must consist at leats 8 characters, 1 lowercast, 1 uppercases, 1 numbers and 1 symbols";
        }
        //check whether email already exist 
        const check = {
            text: "select * from users.credential where email=$1",
            values: [email]
        };
        const user_email = await queryByPromise(check);
        if (user_email.result.length!==0) {
            isBodyValid = false;
            errors['email'] = "Duplicated email";
        };
        
        //if got error respond with error 
        if(!isBodyValid){
            return res.status(400).json({
                sucess: false,
                errorMessage: 'Please enter a valid input',
                errors 
            });
        };

        //hash the password before storing it into the db
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password,salt);
        
        //store user email & password to db
        const my_query = {
            text: `INSERT INTO users.credential (email, password) VALUES($1,$2)`,
            values: [email,hash]
        };
        const newUser = await queryByPromise(my_query);

        //get user id
        const newUserCredential = await queryByPromise(
            `select * from users.credential where email='${email}'`);
        const user_id = newUserCredential.result[0].user_id;

        //create token
        const token = createToken(user_id);
        return res.status(200).json({status:true, message:"signup successfully!", email:email, token:token})
    }
};

module.exports = userController;
