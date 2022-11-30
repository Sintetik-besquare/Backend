const express = require('express');
const router = express.Router();

//controller for user
const userController = require('../controllers/user');
const {signupValidation,loginValidation,sendPasswordLinkValidation,resetPasswordValidation} = require('../middlewares/validatorUser.js');

router
.post('/login',loginValidation,userController.loginUser)
.post('/signup',signupValidation,userController.signupUser)
.post('/password-reset',sendPasswordLinkValidation,userController.sendPasswordLink)
.post('/password-reset/:id/:token',resetPasswordValidation ,userController.resetPassword)

module.exports= router;     