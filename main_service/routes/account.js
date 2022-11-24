const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
//controller for user
const userController = require('../controllers/account');
const {resetBalanceValidation,resetPasswordValidation,userDetailsValidation} = require('../middlewares/validatorAccount.js');
router
.patch('/resetBalance',requireAuth,resetBalanceValidation,userController.resetUserBalance)
.get('/getBalance',requireAuth,userController.getUserBalance)
.get('/getTransaction',requireAuth,userController.getUserTransaction)
.get('/getContractSummary',requireAuth,userController.getUserContractSummary)
.patch('/resetPassword',requireAuth,resetPasswordValidation,userController.resetPassword)
.get('/getUserDetails',requireAuth, userController.getUserDetails)
.patch('/editUserDetails',requireAuth,userDetailsValidation,userController.editUserDetails)
.post('/logout',requireAuth,userController.userLogout)

module.exports= router;    