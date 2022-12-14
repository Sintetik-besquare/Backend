const { queryByPromise } = require("../dbconfig/db");
const contract_unit_price = require("./option_pricing");
const redis = require("../dbconfig/redis_config");
const dbQuery = require("../db_query/query");

class Contract {
  constructor(
    index,
    client_id,
    option_type,
    contract_type,
    stake,
    ticks,
    entry_time,
    digit = 0
  ) {
    this.index = index;
    this.client_id = client_id;
    this.contract_type = contract_type;
    this.option_type = option_type;
    this.stake = stake;
    this.ticks = ticks;
    this.entry_time = entry_time;
    this.exit_time = entry_time + ticks;
    this.isBalance = false;
    this.isEntryTime = false;
    this.comm = 0.012;
    if (this.index === "VOL20") {
      this.sigma = 0.2;
    } else if (this.index === "VOL40") {
      this.sigma = 0.4;
    } else if (this.index === "VOL60") {
      this.sigma = 0.6;
    } else if (this.index === "VOL80") {
      this.sigma = 0.8;
    } else if (this.index === "VOL100") {
      this.sigma = 1;
    } else if (this.index === "VOL200") {
      this.sigma = 2;
    }
    this.digit = digit;
  }

  //Rules of win and lost for all available contracts
  isWinningRiseFall(current_price) {
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
  isWinningEvenOdd(current_price) {
    if (this.option_type === "even") {
      if (current_price.toFixed(2).slice(-1) % 2 === 1) {
        return "Lost";
      }
      return "Win";
    } else if (this.option_type === "odd") {
      if (current_price.toFixed(2).slice(-1) % 2 === 1) {
        return "Win";
      }
      return "Lost";
    }
  }
  isWinningMatchesDiffers(current_price) {
    if (this.option_type === "differs") {
      if (current_price.toFixed(2).slice(-1) === this.digit.toString()) {
        return "Lost";
      }
      return "Win";
    } else if (this.option_type === "matches") {
      if (current_price.toFixed(2).slice(-1) === this.digit.toString()) {
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

    //if feed price not in redis get it from db
    if (current_price.length === 0) {
      current_price = await dbQuery.getFeedPrice(
        this.index,
        this.entry_time + timesRun
      );
    }

    let r = {
      contract_id: this.contract_id,
    };

    //get contract status
    if (this.contract_type === "Rise/fall") {
      r.status = this.isWinningRiseFall(current_price);
    } else if (this.contract_type === "Even/odd") {
      r.status = this.isWinningEvenOdd(current_price);
    } else if (this.contract_type === "Matches/differs") {
      r.status = this.isWinningMatchesDiffers(current_price);
    }

    return r;
  }

  async checkBalance() {
    const balance = await dbQuery.getBalance(this.client_id);

    if (balance > this.stake) {
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

    return Math.round(payout * 100) / 100;
  }

  async buy() {
    //check entry time
    let current_time = Math.floor(Date.now() / 1000);
    if (
      this.entry_time >= current_time ||
      this.entry_time < current_time - 5 ||
      !this.entry_time ||
      isNaN(this.entry_time) ||
      /\s/.test(this.entry_time)
    ) {
      return { status: false, errors: "Invalid entry time" };
    }
    //check index
    let indices = ["VOL20", "VOL40", "VOL60", "VOL80", "VOL100", "VOL200"];
    let found = indices.some((index) => index === this.index);
    if (!found) {
      return { status: false, errors: "Invalid index" };
    }
    //check contract type
    let contract_type = ["Rise/fall", "Even/odd", "Matches/differs"];
    let found2 = contract_type.some((type) => type === this.contract_type);
    if (!found2) {
      return { status: false, errors: "Invalid contract type" };
    }
    //check option type
    if (this.contract_type === "Rise/fall") {
      if (this.option_type !== "put" && this.option_type !== "call") {
        return { status: false, errors: "Invalid option type" };
      }
    } else if (this.contract_type === "Even/odd") {
      if (this.option_type !== "even" && this.option_type !== "odd") {
        return { status: false, errors: "Invalid option type" };
      }
    } else if (this.contract_type === "Matches/differs") {
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
    if (this.contract_type === "Matches/differs") {
      let digit = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      let found4 = digit.some((digit) => digit === this.digit);
      if (!found4) {
        return {
          status: false,
          errors: "Digit can only between 0 to 9 and not empty",
        };
      }
    }
    //check stake
    if (
      isNaN(this.stake) ||
      !this.stake ||
      /\s/.test(this.stake) ||
      this.stake < 0.01
    ) {
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

    //if feed price not in redis get it from db
    if (entry_price.length === 0) {
      entry_price = await dbQuery.getFeedPrice(this.index, this.entry_time);
    }

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
    if (this.contract_type === "Matches/differs") {
      r.digit = this.digit;
    }

    //deduct balance with stake and update it to client_account table
    //store and update contract_summary and transaction tables
    await dbQuery.updateActiveContract(
      r.index,
      r.contract_type,
      r.option_type,
      r.ticks,
      r.stake,
      r.entry_time,
      r.entry_price,
      r.client_id,
      r.digit
    );

    //get contract id
    const contract_id = await dbQuery.getContractId(r.client_id, r.entry_time);
    this.contract_id = contract_id;
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

    //if feed price not in redis get it from db
    if (exit_price.length === 0) {
      exit_price = await dbQuery.getFeedPrice(this.index, this.exit_time);
    }

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
    if (this.contract_type === "Rise/fall") {
      r.status = this.isWinningRiseFall(this.exit_price);
    } else if (this.contract_type === "Even/odd") {
      r.status = this.isWinningEvenOdd(this.exit_price);
    } else if (this.contract_type === "Matches/differs") {
      r.status = this.isWinningMatchesDiffers(this.exit_price);
    }
    //depend on status generate payout accordingly
    if (r.status === "Lost") {
      r.payout = 0.0;
    } else {
      r.payout = final_payout;
    }

    //include digit if the contract is Matches/differ
    if (this.contract_type === "Matches/differs") {
      r.digit = this.digit;
    }

    //update client account, contract_summary and transaction tables
    await dbQuery.updateClosedContract(
      r.payout,
      r.entry_time,
      r.exit_time,
      r.exit_price,
      r.client_id,
      r.contract_id
    );

    return r;
  }
}

module.exports = Contract;
