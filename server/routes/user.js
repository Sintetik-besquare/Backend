const express = require('express');
const router = express.Router();

//controller for user
const userController = require('../controllers/user');

//list of endpoint for user
router
//example 
.get('/',userController.getAll)
.post('/',userController.createUser)
.get('/:id',userController.getById)
.put('/:id',userController.updateUser)
.delete('/:id',userController.deleteUser)

module.exports= router;    
