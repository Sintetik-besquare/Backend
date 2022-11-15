const Redis = require('ioredis');

const env = process.env;
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT
});

const historicalFeed = {
    getFeed: async (req,res)=>{
        ( async () => {
            
            const val = await redis.xrevrange('price feed','+','-','COUNT','10');
            return res.status(200).json({status: true, message:val})
        })();
        
    },
}
module.exports = historicalFeed
