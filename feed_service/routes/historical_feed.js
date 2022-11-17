const express = require('express');
const router = express.Router();

//controller for historical feed price
const historicalFeedController = require('../controllers/historical_feed');

router
.get('/historical/:index',historicalFeedController.getFeed)


module.exports= router;   