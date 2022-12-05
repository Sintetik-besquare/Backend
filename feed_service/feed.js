const { queryByPromise } = require('./dbconfig/db');
const randomNormal = require('random-normal');
const redis = require("./dbconfig/redis_config");

function brownianMotion(mu, sigma) {
  sigma = Math.sqrt(sigma);
  W = randomNormal({mean:mu, dev:sigma}) * Math.sqrt(1/(365*86400));
  X = (1/(365*86400) * (mu - (0.5 * Math.pow(sigma, 2)))) + (sigma * W);
  S = S_feed[S_feed.length - 1] * Math.exp(X);
  return S;
}

let S0 = 20000;
let S_feed = [S0];


async function send_feed(sigma, symbol_name) {
  let current_time = Math.floor(Date.now()/1000) ;
  let S = (Math.round(brownianMotion(0, sigma) * 100) / 100).toFixed(2);
  S_feed.push(S);
  S_feed.shift();
  
  let r = {
    price : S,
    timestamp : current_time,
    symbol_name : symbol_name,
  };

  //publish price feed
  //store data to redis stream
  await redis.publish(r.symbol_name, JSON.stringify(r));
  await redis.xadd(r.symbol_name,"MAXLEN","3600", "*","price",r.price,"timestamp",r.timestamp,"symbol_name",r.symbol_name);

  //store data to postgres
  const my_query = {
    text:`CALL storeFeed($1,$2,$3);`,
    values:[r.symbol_name, r.price, r.timestamp]
  };
  await queryByPromise(my_query);

};

//publish and store the feed for every second
setInterval(function(){
  send_feed(0.2,"VOL20");
  send_feed(0.4,"VOL40");
  send_feed(0.6,"VOL60");
  send_feed(0.8,"VOL80");
  send_feed(1,"VOL100");
  send_feed(2,"VOL200");
}, 1000);
