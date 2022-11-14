const { queryByPromise } = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const { validationResult } = require('express-validator');


const accountController = {
  //Topup/Reset Balance
  resetUserBalance: async (req, res) => {
    const client_id = req.user;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

    //epoc time without microsecond
    let current_time = Math.floor(Date.now() / 1000);

    //update transaction and account table
    const my_query = {
      text:
      `CALL updateBalanceAfterReset($1,'ResetBalance','20000','20000',$2);`,
      values:[current_time,client_id]
    }
    await queryByPromise(my_query);

    //get user latest balance
    const my_query2 = {
      text:
      `SELECT balance FROM client.account WHERE client_id = $1;`,
      values:[client_id]
    }
    const user_balance = await queryByPromise(my_query2);

    //return user latest balance
    return res.status(200).json({
      status: true,
      message: "successfully reset balance!",
      balance: user_balance.result[0].balance,
    });
  },

  getUserBalance: async (req, res) => {
    const client_id = req.user;

    //get user latest balance
    const my_query = {
      text:
      `SELECT balance FROM client.account WHERE client_id = $1;`,
      values:[client_id]
    }
    const user_balance = await queryByPromise(my_query);

    //return user latest balance
    return res.status(200).json({
      status: true,
      message: "successfully retrived user balance!",
      balance: user_balance.result[0].balance,
    });
  },

  getUserTransaction: async (req, res) => {
    const client_id = req.user;

    //get user recent 200 transactions
    const my_query = {
      text:
      `SELECT * FROM client.transaction 
      WHERE client_id = $1 
      ORDER BY transaction_time DESC LIMIT 200;`,
      values:[client_id]
    }
    const user_transaction = await queryByPromise(my_query);

    return res.status(200).json({
      status: true,
      message: "successfully retrived user transaction!",
      transaction: user_transaction.result,
    });
  },
  
  getUserContractSummary:async (req, res) => {
    const client_id = req.user;

    //get user recent 200 transactions
    const my_query = {
      text:
      `SELECT * FROM client.contract_summary 
      WHERE client_id = $1 
      ORDER BY contract_id DESC LIMIT 200;`,
      values:[client_id]
    }
    const user_transaction = await queryByPromise(my_query);

    return res.status(200).json({
      status: true,
      message: "successfully retrived user transaction!",
      transaction: user_transaction.result,
    });
  },

  resetPassword: async (req, res) => {
    const client_id = req.user;
    const { old_password, new_password,new_password_confirmation} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };
    
    //hash new password
    const salt = await bcrypt.genSalt(10);
    const new_hash = await bcrypt.hash(new_password, salt);
 
    //reset user password
    const my_query = {
      text:
      `UPDATE client.account SET password = $1 WHERE client_id= $2;`,
      values:[new_hash,client_id]
    }
    await queryByPromise(my_query);

    return res.status(200).json({
      sucess: true,
      message: "Password successfully reset",
    });
  },

  getUserDetails: async (req, res) => {
    const client_id = req.user;
    const my_query = {
      text:
      `SELECT first_name, last_name, gender, residence, 
      occupation, age, education, date_join
      FROM client.account WHERE client_id = $1;`,
      values:[client_id]
    }

    //get user details
    const user_details = await queryByPromise(my_query);

    return res.status(200).json({
      status: true,
      message: "successfully retrived user details!",
      user_details: user_details.result,
    });
  },

  editUserDetails: async (req, res) => {
    const client_id = req.user;
    const { firstname, lastname, gender, residence, occupation, age, education } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };
    
    const my_query = {
      text:
      `UPDATE client.account SET first_name=$1, last_name=$2, gender=$3,
      residence=$4, occupation=$5, age=$6, education =$7 
      WHERE client_id = $8;`,
      values:[firstname,lastname,gender,residence,occupation,age,education,client_id]
    }
    await queryByPromise(my_query);

    return res.status(200).json({
        status: true,
        message: "successfully edited user details!",
      });
  },
};

module.exports = accountController;
