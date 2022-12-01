const dbQuery = require("../db_query/query");
const bcrypt = require("bcrypt");
const redis = require("../dbconfig/redis_config");

const hashPassword = async (password) => {
  //hash the password before storing it into db
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

async function resetBalance(client_id) {
  //epoc time without microsecond
  let current_time = Math.floor(Date.now() / 1000);

  //update transaction and account table
  await dbQuery.updateTransAccR(current_time, client_id);

  //get user latest balance
  const user_balance = await dbQuery.getBalance(client_id);
  return user_balance;
}

async function getBalance(client_id) {
  //get user latest balance
  const user_balance = await dbQuery.getBalance(client_id);
  return user_balance;
}

async function getTransaction(client_id) {
  //get user recent 100 transactions
  const user_transaction = await dbQuery.getTranstion(client_id);
  return user_transaction;
}

async function getContractSummary(client_id) {
  //get user recent 100 transactions
  const contract_summary = await dbQuery.getContractSummary(client_id);
  return contract_summary;
}

async function resetPassL(client_id, new_password) {
  //hash new password
  const new_hash = await hashPassword(new_password);

  //reset user password
  await dbQuery.resetPass(new_hash, client_id);
}

async function getDetails(client_id) {
  //get user details
  const user_details = await dbQuery.getDetails(client_id);
  return user_details;
}

async function editDetails(client_id, firstname, lastname, gender, residence, occupation, age, education){
    await dbQuery.editDetails(client_id, firstname, lastname, gender, residence, occupation, age, education);
}

async function logout(authorization, expiration_time){
    const token = authorization.split(" ")[1];

    //add token to redis (blacklist)
    const token_key = `bl_${token}`;
    await redis.set(token_key, token);
    redis.expire(token_key, expiration_time);
}

module.exports = {
  resetBalance,
  getBalance,
  getTransaction,
  getContractSummary,
  resetPassL,
  getDetails,
  editDetails,
  logout
};
