const Redis = require("ioredis");
const env = process.env;
const redis = new Redis({
  host: "redis",
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
});

const { queryByPromise } = require("../dbconfig/db");
const historicalFeed = {
    getFeed: async (req, res)=>{
    
        const {index} = req.params;
        try{
            let val = await redis.xrevrange(index.toUpperCase(),'+','-','COUNT','10');
            let storage_type = "redis";
            
        if (val.length === 0){
            const my_query = {
                text: `
                SELECT p.price, p.ts, n.symbol_name 
                FROM feed.symbol_price AS p 
                LEFT JOIN feed.symbol AS n 
                ON p.symbol_id = n.id 
                WHERE n.symbol_name = $1 
                ORDER BY p.ts desc
                LIMIT 10;`,
                values: [index.toUpperCase()],
              };
              val = await queryByPromise(my_query);
              val = val.result;
              storage_type = "postgres"
        }

        return res.status(200).json({format:storage_type,message:val});
        }catch(error){
            console.log(error);
            return res.status(error.status || 500).json({errors: error.message || "Internal server error"});
        };
        
    },
}
module.exports = historicalFeed
