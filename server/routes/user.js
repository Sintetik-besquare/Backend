const express = require('express');
const router = express.Router();

//controller for user
const userController = require('../controllers/user');

router
.post('/login',userController.loginUser)
.post('/signup',userController.signupUser)


module.exports= router;    