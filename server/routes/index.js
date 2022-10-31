const express = require('express');

//controllers
const users =  require('../controllers/user.js');

// middlewares
const { encode } = require('../middlewares/jwt.js');

const router = express.Router();

//list of endpoint for index
router
  .post('/login/:userId', encode, (req, res) => { });

module.exports = router;