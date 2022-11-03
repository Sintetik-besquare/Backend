const Redis = require('redis');
  const redis = new Redis.createClient({
    socket: {
    host:'localhost',
    port:6379,
    }
  });
  (async () => {await redis.connect()})();
const historicalFeed = {
    getFeed: async (req,res)=>{
        ( async () => {
            
            const val = await redis.sendCommand(['XREVRANGE','sintetik_feed','+','-','COUNT','10']);
            return res.status(200).json({sucess: true, message:val})
        })();
        
    },
}
module.exports = historicalFeed

// ( async () => {
//    return val = await redis.sendCommand(['XREVRANGE','sintetik_feed','+','-','COUNT','1']);
//   })();s