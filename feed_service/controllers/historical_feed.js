
const redis = require("../dbconfig/redis_config");
const historicalFeed = {
    getFeed: async (req, res)=>{
    
        const {index} = req.params;
        const val = await redis.xrevrange(index.toUpperCase(),'+','-','COUNT','10');
        return res.status(200).json({message:val})
        
    },
}
module.exports = historicalFeed
