const Redis = require('ioredis');

const env = process.env;
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT,
  password:env.REDIS_PASSWORD
});

const historicalFeed = {
    getFeed: async (req,res)=>{
        ( async () => {
            const {index} = req.params;
            const val = await redis.xrevrange(index.toUpperCase(),'+','-','COUNT','10');
            return res.status(200).json({status: true, message:val})
        })();
        
    },
}
module.exports = historicalFeed
