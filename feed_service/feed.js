require('dotenv').config();
const linspace = require('linspace');
const Redis = require('ioredis');
const env =process.env;
const { queryByPromise } = require('./dbconfig/db');
const randomNormal = require('random-normal');

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
  W[i] = randomNormal({dev:sigma}) * Math.sqrt(dt);
	X[i] = (dt * (mu - 0.5 * Math.pow(sigma, 2))) + (sigma * W[i]);
	S[i] = S_feed[S_feed.length - 1] * Math.exp(X[i]);
  }
  return S;
  // geometric brownian motion
}

let S0 = 20000;
let S_feed = [S0];


function send_feed() {

  // the rand value below will be used to determine when the feed will be "reset" around 20k
  // this will be done under the condition that the rand value is below 0.2
  // the value of 0.2 was determined based on trial & error under the aim of limiting the number of "reset" times as much as possible whilst also ensuring that the feed value does not exceed a certain range
  // if the above condition is met, weight parameters are set which will be used to introduce the S0 value back into the feed (as shown in line 65 below)
  // a maximum weight value of 0.1 was chosen for S0 to ensure that the S0 value does not influence the current feed value too much
  // if the above condition is not met, then the current feed value is only dependent on the previous feed value

  let rand = Math.random();

  if (rand < 0.2) {
    weight1 = 0.1;
    weight2 = 0.9;
  } else {
    weight1 = 0;
    weight2 = 1;
  }

function final_feed(sigma, symbol_name){
  let current_time = Math.floor(Date.now()/1000) ;
  let S, final_S;
  S = brownianMotion(2, 0, sigma, 0.01);
  // append only the first element of the geometric brownian motion into the S_feed array:
  S_feed.push((S0 * weight1) + (S[0] * weight2));
  // take the last element of the S_feed array
  final_S =  (Math.round(S_feed.slice(-1) * 100) / 100).toFixed(2);
  // delete the first item in the array:
  S_feed.shift();
 

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
