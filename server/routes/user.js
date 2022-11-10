const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
//controller for user
const userController = require('../controllers/user');

router
.post('/login',userController.loginUser)
.post('/signup',userController.signupUser)
.post('/resetBalance',requireAuth,userController.resetUserBalance)
.get('/getBalance',requireAuth,userController.getUserBalance)
.get('/getTransaction',requireAuth,userController.getUserTransaction)
.post('/resetPassword',requireAuth,userController.resetPassword)

module.exports= router;    