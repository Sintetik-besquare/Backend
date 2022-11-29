const { queryByPromise } = require("../dbconfig/db");
const contract_unit_price = require("../pricing/option_pricing");
const redis = require("../dbconfig/redis_config");

class Contract {
  constructor(index, client_id, option_type, contract_type, stake, ticks, entry_time, digit=0) {
    this.index = index;
    this.client_id = client_id;
    this.contract_type = contract_type;
    this.option_type = option_type ;
    this.stake = stake;
    this.ticks = ticks;
    this.entry_time = entry_time;
    this.exit_time = entry_time + ticks;
    this.isBalance = false;
    this.isEntryTime = false;
    this.comm = 0.012;
    this.sigma = 1;
    this.digit = digit;
  }

  //Rules of win and lost for all available contracts
  isWinningRiseFall(current_price){
    if (this.option_type === "call") {
      if (this.entry_price > current_price) {
        return "Lost";
      }
      return "Win";
    } else if (this.option_type === "put") {
      if (this.entry_price > current_price) {
        return "Win";
      }
      return "Lost";
    }
  }
  isWinningEvenOdd(current_price){
    if (this.option_type === "even") {
      if ((current_price.toFixed(2).slice(-1))%2 === 1) {
        return "Lost";
      }
      return "Win";
    } else if (this.option_type === "odd") {
      if ((current_price.toFixed(2).slice(-1))%2 === 1) {
        return "Win";
      }
      return "Lost";
    }
  }
  isWinningMatchesDiffers(current_price){
    if (this.option_type === "differs") {
      if ((current_price.toFixed(2).slice(-1))===this.digit.toString()) {
        return "Lost";
      }
      return "Win";
    } else if (this.option_type === "matches") {
      if ((current_price.toFixed(2).slice(-1))===this.digit.toString()) {
        return "Win";
      }
      return "Lost";
    }
  }

  //return contract status for each tick
  async checkStatus(timesRun) {
    //get current price
    let current = await redis.xrange(
      this.index,
      (this.entry_time + timesRun) * 1000 + 1,
      (this.entry_time + timesRun) * 1000 + 999
    );
    let current_price = parseFloat(current[0][1][1]);

    // console.log("entry price is ", this.entry_price, "time is", this.entry_time);
    // console.log("current price is ", current_price, "time is", this.entry_time + timesRun);
    let r = {
      contract_id: this.contract_id,
    };

    //get contract status
    if(this.contract_type === "Rise/fall"){
      r.status = this.isWinningRiseFall(current_price);
    }else if (this.contract_type === "Even/odd"){
      r.status = this.isWinningEvenOdd(current_price);
    }else if (this.contract_type === "Matches/differs"){
      r.status = this.isWinningMatchesDiffers(current_price);
    }
    

    return r;
  }

  async checkBalance() {
    const my_query = {
      text: `SELECT balance FROM client.account WHERE client_id = $1;`,
      values: [this.client_id],
    };

    let balance = await queryByPromise(my_query);

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
        this.option_type,
        this.contract_type
      ) +
        this.comm);
        
    return (Math.round(payout * 100) / 100);
  }

  async buy() {
    //check entry time
    let current_time = Math.floor(Date.now() / 1000);
    if (this.entry_time >= current_time || this.entry_time < current_time - 1
      || !this.entry_time || isNaN(this.entry_time) || /\s/.test(this.entry_time)) {
      return { status: false, errors: "Invalid entry time" };
    }
    //check index
    let indices = ["VOL100"];
    let found = indices.some((index) => index === this.index);
    if (!found) {
      return { status: false, errors: "Invalid index" };
    }
    //check contract type
    let contract_type = ["Rise/fall", "Even/odd","Matches/differs"];
    let found2 = contract_type.some((type) => type === this.contract_type);
    if (!found2) {
      return { status: false, errors: "Invalid contract type" };
    }
    //check option type
    if(this.contract_type === "Rise/fall"){
      if (this.option_type !== "put" && this.option_type !== "call") {
        return { status: false, errors: "Invalid option type" };
      }
    }else if (this.contract_type === "Even/odd"){
      if (this.option_type !== "even" && this.option_type !== "odd") {
        return { status: false, errors: "Invalid option type" };
      }
    }else if (this.contract_type === "Matches/differs"){
      if (this.option_type !== "matches" && this.option_type !== "differs") {
        return { status: false, errors: "Invalid option type" };
      }
    }
    //check ticks
    let ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let found3 = ticks.some((ticks) => ticks === this.ticks);
    if (!found3) {
      return {
        status: false,
        errors: "Ticks can only between 1 to 10 and not empty",
      };
    }
    //check digit if contract is matches/differs 
    if(this.contract_type==="Matches/differs"){
    let digit = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let found4 = digit.some((digit)=>digit===this.digit);
    if (!found4) {
      return {
        status: false,
        errors: "Digit can only between 0 to 9 and not empty",
      };
    };
    }
    //check stake
    if (
      isNaN(this.stake) || !this.stake || /\s/.test(this.stake) || this.stake < 0.01) {
      return {
        status: false,
        errors: "stake must be a number and not less than 0.01",
      };
    }
    //check client balance
    await this.checkBalance();
    if (!this.isBalance) {
      return { status: false, errors: "Insufficient balance" };
    }

    //get entry price
    let price = await redis.xrange(
      this.index,
      this.entry_time * 1000 + 1,
      this.entry_time * 1000 + 999
    );

    let entry_price = price[0][1][1];
    this.entry_price = parseFloat(entry_price);

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

    //include digit if the contract is Matches/differ
    if(this.contract_type==="Matches/differs"){
      r.digit = this.digit;
    };

    //deduct balance with stake and update it to client_account table
    //store buy contract summary
    const my_query = {
      text: `CALL updateActiveContract($1,$2,$3,$4,$5,$6,$7,$8,$9,'Buy');`,
      values: [
        r.index,
        r.contract_type,
        r.option_type,
        r.ticks,
        r.stake,
        r.entry_time,
        r.entry_price,
        r.client_id,
        r.digit
      ],
    };
    await queryByPromise(my_query);

    //get contract id
    const my_query2 = {
      text: `SELECT contract_id FROM client.contract_summary 
      WHERE client_id=$1 AND entry_time=$2;`,
      values: [r.client_id, r.entry_time],
    };
    let contract_id = await queryByPromise(my_query2);

    this.contract_id = contract_id.result[0].contract_id;
    r.contract_id = this.contract_id;
    return r;
  }

  async sell() {
    //get exit price
    let price = await redis.xrange(
      this.index,
      this.exit_time * 1000 + 1,
      this.exit_time * 1000 + 999
    );

    let exit_price = price[0][1][1];
    this.exit_price = parseFloat(exit_price);

    let final_payout = await this.calculatePayout();

    //inset into database according to client & update balance
    let r = {
      client_id: this.client_id,
      contract_id: this.contract_id,
      option_type: this.option_type,
      ticks: this.ticks,
      stake: this.stake,
      entry_price: this.entry_price,
      entry_time: this.entry_time,
      exit_price: this.exit_price,
      exit_time: this.exit_time,
    };
    //get contract status
    if(this.contract_type === "Rise/fall"){
      r.status = this.isWinningRiseFall(this.exit_price);
    }else if (this.contract_type === "Even/odd"){
      r.status = this.isWinningEvenOdd(this.exit_price);
    }else if (this.contract_type === "Matches/differs"){
      r.status = this.isWinningMatchesDiffers(this.exit_price);
    }
    //depend on status generate payout accordingly 
    if(r.status === "Lost"){
      r.payout = 0.0;
    }else{
      r.payout = final_payout;
    }

    //include digit if the contract is Matches/differ
    if(this.contract_type==="Matches/differs"){
      r.digit = this.digit;
    };
  
    const my_query = {
      text: `CALL updateClosedContract($1,$2,$3,$4,$5,$6,'Sell');`,
      values: [
        r.payout,
        r.entry_time,
        r.exit_time,
        r.exit_price,
        r.client_id,
        r.contract_id,
      ],
    };
    console.log(r.payout);
    await queryByPromise(my_query);
    return r;
  }
}

module.exports = Contract;
