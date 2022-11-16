require('dotenv').config();
const linspace = require('linspace');
const math = require('mathjs');
const Redis = require('ioredis');
const env =process.env;
const { queryByPromise } = require('./dbconfig/db');
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT
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

let S, feed, final_S;
S = brownianMotion(2, 0, 0.1, 0.01);
// append only the first element of the geometric brownian motion into the S_feed array:
S_feed.push(S[0].toFixed(2));
// delete the previous element (first element) in the array:
S_feed.shift();
// take the last element of the S_feed array
final_S = S_feed.slice(-1)[0];
let current_time = Math.floor(Date.now()/1000) ;
feed = {
  "price": final_S,
  "timestamp": current_time,
  "symbol_name": "Volatility 10 (1s)"
};

( async () => {
//publish price feed
await redis.publish("price feed", JSON.stringify(feed));

//store data to redis stream
await redis.xadd("price feed","MAXLEN","86400", "*","price",feed.price,"timestamp",feed.timestamp,"symbol_name",feed.symbol_name);

//store data to postgres
const my_query = {
  text:`CALL storeFeed($1,$2,$3);`,
  values:[feed.symbol_name,feed.price,feed.timestamp]
};

await queryByPromise(my_query);

})();

};
setInterval(send_feed, 1000);
