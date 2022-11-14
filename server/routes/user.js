const express = require('express');
const router = express.Router();

//controller for user
const userController = require('../controllers/user');
const {signupValidation,loginValidation} = require('../middlewares/validatorUser.js');

router
.post('/login',loginValidation,userController.loginUser)
.post('/signup',signupValidation,userController.signupUser)

module.exports= router;     