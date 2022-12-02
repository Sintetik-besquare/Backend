const { validationResult } = require("express-validator");
const apiService =require("../api_services/account");

const accountController = {
  //Topup/Reset Balance
  resetUserBalance: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client_id = req.user;

      const user_balance = await apiService.resetBalance(client_id);

      //return user latest balance
      return res.status(200).json({
        message: "successfully reset balance!",
        balance: user_balance,
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
      const user_balance = await apiService.getBalance(client_id);

      return res.status(200).json({
        message: "successfully retrived user balance!",
        balance: user_balance,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserTransaction: async (req, res, next) => {
    try {
      const client_id = req.user;

      //get user recent 100 transactions
      const user_transaction = await apiService.getTransaction(client_id);

      return res.status(200).json({
        message: "successfully retrived user transaction!",
        transaction: user_transaction,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getUserContractSummary: async (req, res, next) => {
    try {
      const client_id = req.user;

      //get user recent 100 contract summary
      const contract_summary = await apiService.getContractSummary(client_id);

      return res.status(200).json({
        message: "successfully retrived user contract summary!",
        contract_summary: contract_summary,
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

      await apiService.resetPassAfterLogin(client_id,new_password);

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
      
      const user_details = await apiService.getDetails(client_id);
      
      return res.status(200).json({
        message: "successfully retrived user details!",
        user_details: user_details,
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

      await apiService.editDetails(client_id, firstname, lastname, gender, residence, occupation, age, education)

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
      //get token expiration time
      const expiration_time = req.exp;
     
      await apiService.logout(authorization, expiration_time);

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
