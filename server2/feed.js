var linspace = require('linspace');
var redis = require("redis");
var Gaussian = require('gaussian');
var math = require('mathjs');

var S0, S_feed;
const redis_feed = redis.createClient();
redis_feed.connect()

function brownianMotion(T, mu, sigma, dt, S0) {
  var N, t;
  S = [];
  W = [];
  X = [];
  N = Math.round(T / dt);
  t = linspace(0, T, N);

  for(var i=0; i<N; i++) {
  W[i] = Math.random() * (1 - (-1)) + (-1);;
  }
  W = math.cumsum(W);
  for(var i=0; i<W.length; i++) {
    W[i] = W[i] * Math.sqrt(dt);
  }

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
}

S0 = 20000;
S_feed = [S0];

function send_feed() {
  var S, feed, final_S;
  S = brownianMotion(2, 0, 0.1, 0.01, 20000);
  S_feed.push(S[0].toFixed(2));
  S_feed.shift();
  final_S = S_feed.slice(-1)[0];
  let current_time = Date.now();
  feed = {
    "price": final_S,
    "timestamp": current_time,
    "symbol_name": "Volatility 10 (1s)"
  };
  console.log(feed);
  (async () => {await redis_feed.publish("price feed", JSON.stringify(feed));})
  
}

setInterval(send_feed, 1000);
