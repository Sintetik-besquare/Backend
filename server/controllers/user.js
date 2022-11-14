const { queryByPromise } = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const createToken = (client_id) => {
  return jwt.sign({ client_id }, process.env.SECRET, { expiresIn: "1d" });
};

const userController = {
  //login user
  loginUser: async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    };

    //hash the password before storing it into the db
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const initial_balance = 20000.00;
    const date_join = Math.floor(Date.now()/1000);

    //store user email & password to db
    await queryByPromise(`
    INSERT INTO client.account (email, password, balance,date_join) 
    VALUES('${email}','${hash}','${initial_balance}','${date_join}')`,);

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
};

//forget password

module.exports = userController;
