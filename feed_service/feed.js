const linspace = require('linspace');
const { queryByPromise } = require('./dbconfig/db');
const randomNormal = require('random-normal');
const redis = require("./dbconfig/redis_config");

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


async function send_feed(sigma, symbol_name) {

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

  let current_time = Math.floor(Date.now()/1000) ;
  let S, final_S;
  S = brownianMotion(2, 0, sigma, 0.01);
  // append only the first element of the geometric brownian motion into the S_feed array:
  S_feed.push((S0 * weight1) + (S[0] * weight2));
  // take the last element of the S_feed array
  final_S =  (Math.round(S_feed.slice(-1) * 100) / 100).toFixed(2);
  // delete the first item in the array:
  S_feed.shift();
  
  let r = {
    price : final_S,
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
