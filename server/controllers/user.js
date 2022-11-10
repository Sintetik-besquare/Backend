const { queryByPromise } = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const createToken = (client_id) => {
  return jwt.sign({ client_id }, process.env.SECRET, { expiresIn: "1d" });
};

const userController = {
  //login user
  loginUser: async (req, res) => {
    const { email, password } = req.body;

    //validation
    let errors = {};
    let is_body_valid = true;

    //check empty field
    if (!email || !password) {
      is_body_valid = false;
      errors["email"] = "Email cannot be empty";
      errors["password"] = "Password cannot be empty";
    }

    //check whether the email exist
    const user_email = await queryByPromise(`SELECT email FROM client.account WHERE email='${email}'`);
    if (user_email.result.length === 0) {
      is_body_valid = false;
      errors["email"] = "Incorrect email";
      return res.status(400).json({
        sucess: false,
        errorMessage: "Please enter a valid input",
        errors,
      });
    }

    //get user's hashed password
    const hash_password = await queryByPromise(`SELECT password FROM client.account WHERE email='${email}'`);
    const user_hash_password = hash_password.result[0].password;

    //matching password
    const match = await bcrypt.compare(password, user_hash_password);

    if (!match) {
      is_body_valid = false;
      errors["password"] = "Incorrect password";
    }

    //if got error respond with error
    if (!is_body_valid) {
      return res.status(400).json({
        sucess: false,
        errorMessage: "Please enter a valid input",
        errors,
      });
    }

    //get user id
    const user_id = await queryByPromise(`SELECT client_id FROM client.account WHERE email='${email}'`);

    //create token
    const token = createToken(user_id.result[0].client_id);

    return res.status(200).json({
      status: true,
      message: "login successfully!",
      email: email,
      token: token,
    });
  },
  //signup user
  signupUser: async (req, res) => {
    const { email, password } = req.body;

    //validation
    let errors = {};
    let is_body_valid = true;

    //check empty field
    if (!email || !password) {
      is_body_valid = false;
      errors["email"] = "Email cannot be empty";
      errors["password"] = "Password cannot be empty";
    }
    //check email format
    if (!validator.isEmail(email) || validator.isEmpty(email)) {
      is_body_valid = false;
      errors["email"] = "Email is not valid";
    }
    //check password strength
    if (!validator.isStrongPassword(password)) {
      is_body_valid = false;
      errors["password"] =
        "Password must consist at leats 8 characters, 1 lowercast, 1 uppercases, 1 numbers and 1 symbols";
    }
    //check whether password contain empty space
    if(!password || validator.isEmpty(password)){
        is_body_valid = false;
        errors["password"] ="Invalid password";
    }

    //check whether email already exist
    const user_email = await queryByPromise(`select * from client.account where email='${email}'`);
    console.log(user_email );
    if (user_email.result.length !== 0) {
      is_body_valid = false;
      errors["email"] = "Duplicated email";
    }

    //if got error respond with error
    if (!is_body_valid) {
      return res.status(400).json({
        sucess: false,
        errorMessage: "Please enter a valid input",
        errors,
      });
    }

    //hash the password before storing it into the db
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const initial_balance = 20000.00;
    //store user email & password to db
    await queryByPromise(`
    INSERT INTO client.account (email, password, balance) 
    VALUES('${email}','${hash}','${initial_balance}')`,);

    //get user id
    const user_id = await queryByPromise(`SELECT client_id FROM client.account WHERE email='${email}'`);

    //create token
    const token = createToken(user_id.result[0].client_id);
    return res.status(200).json({
      status: true,
      message: "signup successfully!",
      email: email,
      token: token,
    });
  },

  //Topup/Reset Balance
  resetUserBalance: async (req, res) => {
    const { reset_balance } = req.body;
    const client_id = req.user;

    //epoc time without microsecond
    let current_time = Math.floor(Date.now() / 1000);

    //get wither reset balance is true
    if (!reset_balance || reset_balance != "true") {
      return res
        .status(400)
        .json({ status: false, errorMessage: "Invalid action" });
    }

    //update transaction and account table
    await queryByPromise(`
    CALL updateBalanceAfterReset('${current_time}','ResetBalance','20000','20000','${client_id}')`);

    //get user latest balance
    const get_user_balance = {
        text: "SELECT balance FROM client.account WHERE client_id = $1",
        values: [client_id]
      };

    const user_balance = await queryByPromise(get_user_balance);

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
    const get_user_balance = {
        text: "SELECT balance FROM client.account WHERE client_id = $1",
        values: [client_id]
      };

    const user_balance = await queryByPromise(get_user_balance);

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
    const get_user_transaction = {
        text: "SELECT * FROM client.transaction WHERE client_id = $1 ORDER BY transaction_time DESC LIMIT 200",
        values: [client_id]
      };

    const user_transaction = await queryByPromise(get_user_transaction);

    return res.status(200).json({
      status: true,
      message: "successfully retrived user transaction!",
      transaction: user_transaction.result,
    });
  },

  resetPassword: async (req, res) => {
    const client_id = req.user;
    const { old_password, new_password } = req.body;

    //validation
    let errors = {};
    let is_body_valid = true;

    //get old hash password and use bcrypt to compare
    const get_hash_password = {
      text: "SELECT password FROM client.account WHERE client_id=$1",
      values: [client_id],
    };
    const user_hash_password = await queryByPromise(get_hash_password);

    //compare the hash password with old password
    const match = await bcrypt.compare(
      old_password,
      user_hash_password.result[0].password
    );
    if (user_hash_password.result.length === 0 || !match) {
      is_body_valid = false;
      errors["old_password"] = "Incorrect password";
      return res.status(400).json({
        sucess: false,
        errorMessage: "Please enter a valid input",
        errors,
      });
    };

    //check the strength of the new password
    if (!validator.isStrongPassword(new_password)) {
      is_body_valid = false;
      errors["password"] =
        "Password must consist at leats 8 characters, 1 lowercast, 1 uppercases, 1 numbers and 1 symbols";
    };

    //if got error respond with error
    if (!is_body_valid) {
      return res.status(400).json({
        sucess: false,
        errorMessage: "Please enter a valid input",
        errors,
      });
    }

    //hash new password 
    const salt = await bcrypt.genSalt(10);
    const new_hash = await bcrypt.hash(new_password, salt);

    //reset user password
    await queryByPromise(`UPDATE client.account SET password = '${new_hash}' WHERE client_id= '${client_id}'`);

    return res.status(200).json({
      sucess: true,
      message: "Password successfully reset",
    });
  },
};

// getUserInfo: async(req,res)=>{
//     //Todo almost same as get user balance
// },
// getUserTransaction: async(req,res)=>{
//     //Todo almost same as get user balance
//

module.exports = userController;
