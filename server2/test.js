var linspace = require('linspace');
var redis = require("redis");
var Gaussian = require('gaussian');
var math = require('mathjs');

const redis_feed = redis.createClient();
redis_feed.connect()

function brownianMotion(T, mu, sigma, dt) {
  var N, t;
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

function send_feed(T, mu, sigma, dt) {
  S0 = 20000;
  S_feed = [S0];
  var S, feed, final_S;
  S = brownianMotion(T, mu, sigma, dt);
  // append only the first element of the geometric brownian motion into the S_feed array:
  S_feed.push(S[0].toFixed(2)); 
  // delete the previous element (first element) in the array:
  S_feed.shift();
  // take the last element of the S_feed array
  final_S = S_feed[S_feed.length - 1];
  let current_time = Date.now();
  feed = {
    "price": final_S,
    "timestamp": current_time,
    "symbol_name": "Volatility 10 (1s)"
  };
  // console.log(feed);
  return feed;
  (async () => {await redis_feed.publish("price feed", JSON.stringify(feed));})
  
}

setInterval(function(){
  console.log(send_feed(2, 0, 0.1, 0.01))
},1000);
