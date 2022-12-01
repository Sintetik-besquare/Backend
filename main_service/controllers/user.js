require("dotenv").config();
const { validationResult } = require("express-validator");
const apiService =require("../api_services/user");
const dbQuery = require("../db_query/query");

const userController = {
  //login user
  loginUser: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const token = await apiService.login(email);
      
      return res.status(200).json({
        message: "Successfully Login!",
        token: token,
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  //signup user
  signupUser: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      
      const token = await apiService.signup(email,password);

      return res.status(200).json({
        message: "Successfully signup!",
        token: token,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  sendPasswordLink: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      apiService.sendLink(email);

      return res.status(200).json({
        message: "Password reset link has sent to your email account",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      //validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id, token } = req.params;
      const { password} = req.body;

      //check whether link is valid
      const check = await dbQuery.getTokenDetails(id,token);
      let current_time = Math.floor(Date.now() / 1000);

      if (
        check.result.length === 0 ||
        current_time > check.result[0].expired_at
      ) {
        return res.status(400).json({
          message: "Invalid link or expired",
        });
      }

      apiService.resetPasswordF(id,token,password,check.result[0].client_id);
    

      return res.status(200).json({
        message: "Successfully reset password",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};

module.exports = userController;
