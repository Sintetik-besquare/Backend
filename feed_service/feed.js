require('dotenv').config();
const linspace = require('linspace');
const math = require('mathjs');
const Redis = require('ioredis');
const env =process.env;
const { queryByPromise } = require('./dbconfig/db');
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT,
  password:env.REDIS_PASSWORD
});

function brownianMotion(T, mu, sigma, dt) {
  let N, t;
  S = [];
  W = [];
  X = [];
  N = Math.round(T / dt);
  t = linspace(0, T, N);
  // Draw random samples from a normal (Gaussian) distribution
  // generate random numbers where max = 1, min = -1 as mean = 0, std = 1:
  for(var i=0; i<N; i++) {
  W[i] = Math.random() * (1 - (-1)) + (-1);;
  }
  W = math.cumsum(W);
  for(var i=0; i<W.length; i++) {
    W[i] = W[i] * Math.sqrt(dt);
  }
  // standard brownian motion (wiener process)
  for(var i=0; i<t.length; i++) {
	t[i] = t[i] * (mu - 0.5 * Math.pow(sigma, 2));
  }

  for(var i=0; i<W.length; i++) {
    X[i] = t[i] + (sigma * W[i]);
  }

  for(var i=0; i<X.length; i++) {
	  S[i] = S_feed[S_feed.length - 1] * Math.exp(X[i]);
  }
  return S;
  // geometric brownian motion
}

let S0 = 20000;
let S_feed = [S0];


function send_feed() {


function final_feed(sigma, symbol_name){
  let current_time = Math.floor(Date.now()/1000) ;
  let S, feed, final_S;
  S = brownianMotion(2, 0, sigma, 0.01);
  // append only the first element of the geometric brownian motion into the S_feed array:
  S_feed.push(S[0].toFixed(2));
  // delete the previous element (first element) in the array:
  S_feed.shift();
  // take the last element of the S_feed array
  final_S = S_feed.slice(-1)[0];

  return {
    price : final_S,
    timestamp : current_time,
    symbol_name : symbol_name,
  };
}

// feed_vol20= final_feed(0.2,"VOL20");
// feed_vol40= final_feed(0.4,"VOL40");
// feed_vol60= final_feed(0.6,"VOL60");
// feed_vol80= final_feed(0.8,"VOL60");
feed_vol100= final_feed(1,"VOL100");

( async () => {
//publish price feed
//store data to redis stream
// await redis.publish("VOL20", JSON.stringify(feed_vol20));
// await redis.xadd("VOL20","MAXLEN","3600", "*","price",feed_vol20.price,"timestamp",feed_vol20.timestamp,"symbol_name",feed_vol20.symbol_name);

// await redis.publish("VOL40", JSON.stringify(feed_vol40));
// await redis.xadd("VOL40","MAXLEN","3600", "*","price",feed_vol40.price,"timestamp",feed_vol40.timestamp,"symbol_name",feed_vol40.symbol_name);

// await redis.publish("VOL60", JSON.stringify(feed_vol60));
// await redis.xadd("VOL60","MAXLEN","3600", "*","price",feed_vol60.price,"timestamp",feed_vol60.timestamp,"symbol_name",feed_vol60.symbol_name);

// await redis.publish("VOL80", JSON.stringify(feed_vol80));
// await redis.xadd("VOL80","MAXLEN","3600", "*","price",feed_vol80.price,"timestamp",feed_vol80.timestamp,"symbol_name",feed_vol80.symbol_name);

await redis.publish("VOL100", JSON.stringify(feed_vol100));
await redis.xadd("VOL100","MAXLEN","3600", "*","price",feed_vol100.price,"timestamp",feed_vol100.timestamp,"symbol_name",feed_vol100.symbol_name);


//store data to postgres
// const vol20 = {
//   text:`CALL storeFeed($1,$2,$3);`,
//   values:[feed_vol20.symbol_name, feed_vol20.price, feed_vol20.timestamp]
// };
// await queryByPromise(vol20);

// const vol40 = {
//   text:`CALL storeFeed($1,$2,$3);`,
//   values:[feed_vol40.symbol_name, feed_vol40.price, feed_vol40.timestamp]
// };
// await queryByPromise(vol40);

// const vol60 = {
//   text:`CALL storeFeed($1,$2,$3);`,
//   values:[feed_vol60.symbol_name, feed_vol60.price, feed_vol60.timestamp]
// };
// await queryByPromise(vol60);

// const vol80 = {
//   text:`CALL storeFeed($1,$2,$3);`,
//   values:[feed_vol80.symbol_name, feed_vol80.price, feed_vol80.timestamp]
// };
// await queryByPromise(vol80);

const vol100 = {
  text:`CALL storeFeed($1,$2,$3);`,
  values:[feed_vol100.symbol_name, feed_vol100.price, feed_vol100.timestamp]
};
await queryByPromise(vol100);


})();

};
setInterval(send_feed, 1000);
