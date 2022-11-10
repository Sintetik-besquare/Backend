//write a script keep tracking client's contract that's opining
//send the contract's details to frontend through pub/sub
//once the contract ended/closed store it into database
const { queryByPromise } = require("../dbconfig/db");
const contract_unit_price = require("../pricing/option_pricing");

//to determine whether a contract is close or open we need to add status column
const Redis = require("ioredis");

const env = process.env;
const redis = new Redis({
  host: "redis",
  port: env.REDIS_PORT,
});

class Contract {
  constructor(index, client_id, option_type, stake, ticks, entry_time) {
    this.index = index;
    this.client_id = client_id;
    this.contract_type = "Rise/fall";
    this.option_type = option_type;
    this.stake = stake;
    this.ticks = ticks;
    this.entry_time = entry_time;
    this.exit_time = entry_time + ticks;
    this.isBalance = false;
    this.isEntryTime = false;
    this.comm = 0.012;
    if (this.index === "Volatility 10 (1s)") {
      this.sigma = 1;
    }
  }

  async checkStatus() {
    let current = await redis.xrevrange("price feed", "+", "-", "COUNT", "1");
    let current_time = current[0][1][3];
    let current_price = current[0][1][1];

    console.log("entry price is ", this.entry_price, "time is", this.entry_time);
    console.log("current price is ", current_price, "time is", current_time);

    if (this.option_type === "call") {
      if (this.entry_price > current_price) {
        return { status: "Lost" };
      }
      return { status: "Win" };
    } else if (this.option_type === "put") {
      if (this.entry_price > current_price) {
        return { status: "Win" };
      }
      return { status: "Lost" };
    }

    return "Invalid action";
  }

  async checkEntryTime() {
    let current_time = Math.floor(Date.now() / 1000);
    if (this.entry_time > current_time) {
      return (this.isEntryTime = false);
    }
    return (this.isEntryTime = true);
  }

  async checkBalance() {
    let balance = await queryByPromise(
      `SELECT balance FROM client.account 
            WHERE client_id = '${this.client_id}';`
    );

    if (balance.result[0].balance > this.stake) {
      return (this.isBalance = true);
    }
    return (this.isBalance = false);
  }

  async calculatePayout() {
    let payout =
      this.stake /
      (contract_unit_price.bs_binary_option(
        this.entry_price,
        this.entry_price,
        this.sigma,
        this.ticks / (60 * 60 * 24 * 365),
        0,
        0,
        this.option_type
      ) +
        this.comm);
    return payout.toFixed(2);
  }

  async buy() {
    await this.checkEntryTime();
    await this.checkBalance();

    if (!this.isEntryTime) {
      return { status: false, errorMessage: "Invalid entry time" };
    }
    if (this.option_type !== "put" && this.option_type !== "call") {
      return { status: false, errorMessage: "Invalid option type" };
    }
    if (!this.isBalance) {
      return { status: false, errorMessage: "Insufficient balance" };
    }

    //get entry price from entry time
    if (!this.entry_price) {
      let price = await redis.xrevrange("price feed", "+", "-", "COUNT", "1");
      let entry_price = price[0][1][1];
      this.entry_price = entry_price;
    }

    let r = {
      status: true,
      client_id: this.client_id,
      index: this.index,
      contract_type: this.contract_type,
      option_type: this.option_type,
      ticks: this.ticks,
      stake: this.stake,
      entry_time: this.entry_time,
      entry_price: this.entry_price,
    };
  
    //deduct balance with stake and update it to client_account table
    //store buy contract summary
    await queryByPromise(`
    CALL updateActiveContract(
      '${this.index}','${r.contract_type}','${r.option_type}','${r.ticks}',
      '${r.stake}','${r.entry_time}','${r.entry_price}','${r.client_id}',
      'Buy'
    )
    `);

    let contract_id = await queryByPromise(`
    SELECT contract_id FROM client.contract_summary 
    WHERE client_id='${r.client_id}' AND entry_time='${r.entry_time}'
    `);

    this.contract_id = contract_id.result[0].contract_id;
    r.contract_id = this.contract_id;
    return r;
  }

  async sell() {
    let price = await redis.xrevrange("price feed", "+", "-", "COUNT", "1");
    let exit_price = price;
    this.exit_price = exit_price[0][1][1];
    let final_payout = await this.calculatePayout();

    //inset into database according to client & update balance
    let r = {
      client_id: this.client_id,
      contract_id: this.contract_id,
      option_type: this.option_type,
      entry_price: this.entry_price,
      entry_time: this.entry_time,
      exit_price: this.exit_price,
      exit_time: this.exit_time,
    };

    if (this.option_type === "call") {
      if (this.entry_price > this.exit_price) {
        r.status = "Lost";
        r.payout = 0.0;
      } else {
        r.status = "Win";
        r.payout = final_payout;
      }
    } else if (this.option_type === "put") {
      if (this.entry_price > this.exit_price) {
        r.status = "Win";
        r.payout = final_payout;
      } else {
        r.status = "Lost";
        r.payout = 0.0;
      }
    }

    await queryByPromise(`
      CALL updateClosedContract(
        '${r.payout}',
        '${r.entry_time}',
        '${r.exit_time}',
        '${r.exit_price}',
        '${r.client_id}',
        '${r.contract_id}',
        'Sell'
        )`);
    return r;
  }
}

module.exports = Contract;

//all entry time and exit time will still hv 1 sec delay then the actual time(sometimes...)
//even frontend send with price we still have to veriify it with db
//which is impossible as you can't write & read at the same time
