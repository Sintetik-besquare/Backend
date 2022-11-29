// calculate option pricing in Javascript

const mathjs = require("mathjs");

// function for standard normal cumulative distribution
function cdfNormal(x, mean, standardDeviation) {
  return (1 - mathjs.erf((mean - x) / (Math.sqrt(2) * standardDeviation))) / 2;
}

// function for calculating binary option price for a single unit contract:
// delta_t is the difference between the contract start date and the contract expiry date measured in years
// St is the spot price at time t
// K is the strike price
// sigma is the annualised volatility
// r and d are the annual risk-free rate and dividend yield respectively
// (annual risk-free rate is the rate of return offered by an investment that carries zero risk. Since this is not a risk-free trade, the risk-free rate is 0)
function bs_binary_option(St, K, sigma, delta_t, r, d, option_type, contract_type) {
  var d1, d2;
  d1 =
    (1 / (sigma * Math.sqrt(delta_t))) *
    (Math.log(St / K) + (r - d + Math.pow(sigma, 2) / 2) * delta_t);
  d2 = d1 - sigma * Math.sqrt(delta_t);

// d1 is the rate of change of call option price with respect to change in underlying asset spot price
// d2 is the probability that call option expires in the money
// (for the case of rise/fall binary option contract, d2 for both call and put options will tend to hover around 50%)

// calculate the binary option pricing for call and put options

if(contract_type = "Rise/fall"){
  if (option_type === "call") {
    return cdfNormal(d2, 0, 1) * Math.exp(-r * delta_t);
  } else if (option_type === "put"){
    return cdfNormal(-d2, 0, 1) * Math.exp(-r * delta_t);
  };
}
else if (contract_type = "Even/odd")
{
  //call and put have the same payout
  return 0.5 * Math.exp(-r * delta_t);
} 
else if (contract_type === "Matches/Differs") 
{
  if (option_type === "matches"){
    // probability of matching is 0.1
    return 0.1 * Math.exp(-r * delta_t);
  } else if (option_type === "differs") {
    // probability of differing is 0.9
    return 0.9 * Math.exp(-r * delta_t);
  }
};

}

// stake = 15;
// ticks = 1;
// option_type ="put";
// entry_price =6135.34;
// contract_unit_price = bs_binary_option(entry_price, entry_price, 1, (ticks / (60 * 60 * 24 * 365)), 0, 0, option_type) + 0.012;
// payout = stake / contract_unit_price;

// console.log("Rise payout = " + payout.toFixed(2));

module.exports = { bs_binary_option };
