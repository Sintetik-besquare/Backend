const Redis = require('ioredis');

const env = process.env;
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT,
  password:env.REDIS_PASSWORD
});

const historicalFeed = {
    getFeed: async (req, res)=>{
    
        const {index} = req.params;
        const val = await redis.xrevrange(index.toUpperCase(),'+','-','COUNT','10');
        return res.status(200).json({message:val})
        
    },
}
module.exports = historicalFeed
