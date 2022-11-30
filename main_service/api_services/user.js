const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { encrypt } = require("../utils/crypto");
const privateKey = fs.readFileSync(path.join(__dirname, "../jwt_certs/private.pem"),"utf8");
const sendEmail = require("../utils/send_email");
const crypto = require("crypto");
const env = process.env;
const dbQuery = require("../db_query/query");

const hashPassword = async (password)=>{
    //hash the password before storing it into db
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

const createToken = (client_id) => {
  client_id = encrypt(client_id);
  return jwt.sign({ client_id }, privateKey, {
    expiresIn: "1d",
    algorithm: "RS256",
  });
};

async function signup(email, password) {
  //hash the password before storing it into db
  const hash = await hashPassword(password);
  //Set client initial balance and record join date
  const initial_balance = 20000.0;
  const date_join = Math.floor(Date.now() / 1000);
  //store user email & password to db
  await dbQuery.createUser(email, hash, initial_balance, date_join);
  //get client id
  const user_id = await dbQuery.getClientId(email);
  //create token
  const token = createToken(user_id);

  return token;
};

async function login(email){
  //get client id
  const user_id = await dbQuery.getClientId(email);
  //create token
  const token = createToken(user_id);

  return token;
}; 

async function sendLink(email){
  //get client id
  const user_id = await dbQuery.getClientId(email);
  //create token
  const token = crypto.randomBytes(32).toString("hex");
  //token created time
  const created_time = Math.floor(Date.now() / 1000);
  //token expired time
  const expired_time = created_time + 3600;

  //store token into db and get token id
  const id = await dbQuery.storeResetToken(user_id,token,created_time,expired_time);

  //send email
  const link = `${env.EMAIL_BASE_URL}/password-reset/${id}/${token}`;
  await sendEmail(email, "Password Reset", link);
}

async function resetPasswordF(id,token,password,client_id){
    //hash new password if everything is fine
    const new_hash = await hashPassword(password);

    //reset user password
    await dbQuery.resetPassF(new_hash,client_id);

    //after reset password delete token
    await dbQuery.delToken(id,token);
}

module.exports = { signup, login, sendLink, resetPasswordF};
