const express = require('express');
const router = express.Router();

//controller for db
const dbController = require('../controllers/db');

//list of endpoint for db
router
//example 
// .get('/:id',userController.getCredential)
.post('/',dbController.createCredential)
// .put('/:id',dbController.updateCredential)
// .delete('/:id',dbController.deleteCredential)

module.exports= router;      