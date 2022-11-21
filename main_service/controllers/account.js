const { queryByPromise } = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const Redis = require('ioredis');
const env =process.env;
const redis = new Redis({
  host:'redis',
  port:env.REDIS_PORT,
  password:env.REDIS_PASSWORD
});


const accountController = {
  //Topup/Reset Balance
  resetUserBalance: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client_id = req.user;

      //epoc time without microsecond
      let current_time = Math.floor(Date.now() / 1000);

      //update transaction and account table
      const my_query = {
        text: `CALL updateBalanceAfterReset($1,'ResetBalance','20000','20000',$2);`,
        values: [current_time, client_id],
      };
      await queryByPromise(my_query);

      //get user latest balance
      const my_query2 = {
        text: `SELECT balance FROM client.account WHERE client_id = $1;`,
        values: [client_id],
      };
      const user_balance = await queryByPromise(my_query2);

      //return user latest balance
      return res.status(200).json({
        message: "successfully reset balance!",
        balance: user_balance.result[0].balance,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserBalance: async (req, res, next) => {
    try {
      const client_id = req.user;

      //get user latest balance
      const my_query = {
        text: `SELECT balance FROM client.account WHERE client_id = $1;`,
        values: [client_id],
      };
      const user_balance = await queryByPromise(my_query);

      //return user latest balance
      return res.status(200).json({
        message: "successfully retrived user balance!",
        balance: user_balance.result[0].balance,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserTransaction: async (req, res, next) => {
    try {
      const client_id = req.user;

      //get user recent 200 transactions
      const my_query = {
        text: `SELECT * FROM client.transaction 
        WHERE client_id = $1 
        ORDER BY transaction_time DESC LIMIT 200;`,
        values: [client_id],
      };
      const user_transaction = await queryByPromise(my_query);

      return res.status(200).json({
        message: "successfully retrived user transaction!",
        transaction: user_transaction.result,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserContractSummary: async (req, res, next) => {
    try {
      const client_id = req.user;

      //get user recent 200 transactions
      const my_query = {
        text: `SELECT * FROM client.contract_summary 
        WHERE client_id = $1 
        ORDER BY contract_id DESC LIMIT 200;`,
        values: [client_id],
      };
      const user_transaction = await queryByPromise(my_query);

      return res.status(200).json({
        message: "successfully retrived user contract summary!",
        contract_summary: user_transaction.result,
      });
      
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client_id = req.user;
      const { new_password } = req.body;

      //hash new password
      const salt = await bcrypt.genSalt(10);
      const new_hash = await bcrypt.hash(new_password, salt);

      //reset user password
      const my_query = {
        text: `UPDATE client.account SET password = $1 WHERE client_id= $2;`,
        values: [new_hash, client_id],
      };
      await queryByPromise(my_query);

      return res.status(200).json({
        sucess: true,
        message: "Password successfully reset",
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserDetails: async (req, res, next) => {
    try {
      const client_id = req.user;
      const my_query = {
        text: `SELECT email, client_id, first_name, last_name, gender, residence, 
        occupation, age, education, date_join
        FROM client.account WHERE client_id = $1;`,
        values: [client_id],
      };

      //get user details
      const user_details = await queryByPromise(my_query);

      return res.status(200).json({
        message: "successfully retrived user details!",
        user_details: user_details.result,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  editUserDetails: async (req, res, next) => {
    try {
      const client_id = req.user;
      const {
        firstname,
        lastname,
        gender,
        residence,
        occupation,
        age,
        education,
      } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const my_query = {
        text: `UPDATE client.account SET first_name=$1, last_name=$2, gender=$3,
        residence=$4, occupation=$5, age=$6, education =$7 
        WHERE client_id = $8;`,
        values: [
          firstname,
          lastname,
          gender,
          residence,
          occupation,
          age,
          education,
          client_id,
        ],
      };
      await queryByPromise(my_query);

      return res.status(200).json({
        message: "successfully edited user details!",
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  userLogout: async (req, res, next) => {
    try{
      //get token
      const{authorization} = req.headers;
      const token = authorization.split(" ")[1];
      //get user id
      const client_id = req.user;
      //get token expiration time
      const expiration_time = req.exp;
      
      //add token to redis (blacklist)
      const token_key = `bl_${token}`;
      await redis.set(token_key, token);
      redis.expire(token_key, expiration_time);

      return res.status(200).json({
        message: "Token invalidated",
      });

    }catch(error){
      console.log(error);
      next(error);
    }
   
  }
};

module.exports = accountController;
