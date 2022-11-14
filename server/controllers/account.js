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
    await queryByPromise(`
    CALL updateBalanceAfterReset('${current_time}','ResetBalance','20000','20000','${client_id}')`);

    //get user latest balance
    const user_balance = await queryByPromise(
      `SELECT balance FROM client.account WHERE client_id = '${client_id}'`
    );

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
    const user_balance = await queryByPromise(
      `SELECT balance FROM client.account WHERE client_id = '${client_id}'`
    );

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
    const user_transaction = await queryByPromise(
      `SELECT * FROM client.transaction WHERE client_id = '${client_id}' ORDER BY transaction_time DESC LIMIT 200`
    );

    return res.status(200).json({
      status: true,
      message: "successfully retrived user transaction!",
      transaction: user_transaction.result,
    });
  },
  getUserContractSummary:async (req, res) => {
    const client_id = req.user;

    //get user recent 200 transactions
    const user_transaction = await queryByPromise(
      `SELECT * FROM client.contract_summary WHERE client_id = '${client_id}' ORDER BY contract_id DESC LIMIT 200`
    );

    return res.status(200).json({
      status: true,
      message: "successfully retrived user transaction!",
      transaction: user_transaction.result,
    });
  },
  getUserTransaction: async (req, res) => {
    const client_id = req.user;

    //get user recent 200 transactions
    const user_transaction = await queryByPromise(
      `SELECT * FROM client.transaction WHERE client_id = '${client_id}' ORDER BY transaction_time DESC LIMIT 200`
    );

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
    await queryByPromise(
      `UPDATE client.account SET password = '${new_hash}' WHERE client_id= '${client_id}'`
    );

    return res.status(200).json({
      sucess: true,
      message: "Password successfully reset",
    });
  },
  getUserDetails: async (req, res) => {
    const client_id = req.user;

    //get user details
    const user_details = await queryByPromise(
      `SELECT * FROM client.account WHERE client_id = '${client_id}'`
    );

    return res.status(200).json({
      status: true,
      message: "successfully retrived user details!",
      transaction: user_details.result,
    });
  },
  editUserDetails: async (req, res) => {
    const client_id = req.user;
    const { firstname, lastname, gender, residence, occupation, age, education } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };
  
    await queryByPromise(`
    UPDATE client.account SET first_name='${firstname}', last_name='${lastname}', gender='${gender}',
     residence='${residence}', occupation='${occupation}', age='${age}', education ='${education}' 
     WHERE client_id = '${client_id}'`);

    return res.status(200).json({
        status: true,
        message: "successfully edited user details!",
      });
  },
};

// editUserDetails

module.exports = accountController;
