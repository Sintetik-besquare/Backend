//connect db
const { queryByPromise } = require("../dbconfig/db");

async function createUser(email, hash, initial_balance, date_join) {
  //store user email & password to db
  console.log("real creatuser called");
  const my_query = {
    text: `INSERT INTO client.account (email, password, balance, date_join) 
    VALUES($1,$2,$3,$4) RETURNING client_id;`,
    values: [email, hash, initial_balance, date_join],
  };
  const user_id = await queryByPromise(my_query);
  return user_id.result[0].client_id;
}

async function getClientId(email) {
  //get user id
  const my_query = {
    text: `SELECT client_id FROM client.account WHERE email=$1;`,
    values: [email],
  };
  const user_id = await queryByPromise(my_query);
  return user_id.result[0].client_id;
}

async function storeResetToken(user_id, token, created_time, expired_time) {
  //store token into db
  const my_query2 = {
    text: `INSERT INTO client.resetPassword (client_id, token, created_at, expired_at)
  VALUES($1,$2,$3,$4) 
  RETURNING id;`,
    values: [user_id, token, created_time, expired_time],
  };
  const id = await queryByPromise(my_query2);
  return id.result[0].id;
}

async function getTokenDetails(id, token) {
  //check whether link is valid
  const my_query = {
    text: `SELECT client_id, expired_at FROM client.resetPassword 
  WHERE id=$1 AND token=$2;`,
    values: [id, token],
  };
  const check = await queryByPromise(my_query);

  return check;
}

async function resetPass(hash, user_id) {
  //reset user password
  const my_query = {
    text: `UPDATE client.account SET password = $1 WHERE client_id= $2;`,
    values: [hash, user_id],
  };
  await queryByPromise(my_query);
}

async function delToken(id, token) {
  //after reset password delete token
  const my_query = {
    text: `DELETE FROM client.resetPassword WHERE id= $1 AND token=$2;`,
    values: [id, token],
  };
  await queryByPromise(my_query);
}

async function updateTransAccR(current_time, client_id) {
  //update transaction and account table
  const my_query = {
    text: `CALL updateBalanceAfterReset($1,'ResetBalance','20000','20000',$2);`,
    values: [current_time, client_id],
  };
  await queryByPromise(my_query);
}

async function getBalance(client_id) {
  //get user latest balance
  const my_query = {
    text: `SELECT balance FROM client.account WHERE client_id = $1;`,
    values: [client_id],
  };
  const user_balance = await queryByPromise(my_query);
  return user_balance.result[0].balance;
}

async function getTranstion(client_id) {
  //get user recent 100 transactions
  const my_query = {
    text: `SELECT * FROM client.transaction 
    WHERE client_id = $1 
    ORDER BY transaction_time DESC LIMIT 100;`,
    values: [client_id],
  };
  const user_transaction = await queryByPromise(my_query);
  return user_transaction.result;
}

async function getContractSummary(client_id) {
  //get user recent 100 contract summary
  const my_query = {
    text: `SELECT * FROM client.contract_summary 
    WHERE client_id = $1 
    ORDER BY contract_id DESC LIMIT 100;`,
    values: [client_id],
  };
  const contract_summary = await queryByPromise(my_query);
  return contract_summary.result;
}

async function getDetails(client_id) {
  //get user details
  const my_query = {
    text: `SELECT email, client_id, first_name, last_name, gender, residence, 
        occupation, age, education, date_join
        FROM client.account WHERE client_id = $1;`,
    values: [client_id],
  };

  const user_details = await queryByPromise(my_query);
  return user_details.result;
}

async function editDetails(
  client_id,
  firstname,
  lastname,
  gender,
  residence,
  occupation,
  age,
  education
) {
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
}

async function getFeedPrice(index, entry_time) {
  const my_query = {
    text: `
    SELECT price FROM feed.symbol_price 
    where symbol_id=(SELECT id FROM feed.symbol WHERE symbol_name=$1) AND ts =$2;`,
    values: [index, entry_time],
  };
  const current_price = await queryByPromise(my_query);
  return current_price.result[0].price;
}

async function updateActiveContract(
  index,
  contract_type,
  option_type,
  ticks,
  stake,
  entry_time,
  entry_price,
  client_id,
  digit
) {
  //deduct balance with stake and update it to client_account table
  //store buy contract summary
  const my_query = {
    text: `CALL updateActiveContract($1,$2,$3,$4,$5,$6,$7,$8,$9,'Buy');`,
    values: [
      index,
      contract_type,
      option_type,
      ticks,
      stake,
      entry_time,
      entry_price,
      client_id,
      digit,
    ],
  };
  await queryByPromise(my_query);
}

async function getContractId(client_id, entry_time) {
  //get contract id
  const my_query = {
    text: `SELECT contract_id FROM client.contract_summary 
    WHERE client_id=$1 AND entry_time=$2;`,
    values: [client_id, entry_time],
  };
  let contract_id = await queryByPromise(my_query);
  return contract_id.result[0].contract_id;
}

async function updateClosedContract(
  payout,
  entry_time,
  exit_time,
  exit_price,
  client_id,
  contract_id
) {
  const my_query = {
    text: `CALL updateClosedContract($1,$2,$3,$4,$5,$6,'Sell');`,
    values: [
      payout,
      entry_time,
      exit_time,
      exit_price,
      client_id,
      contract_id,
    ],
  };
  await queryByPromise(my_query);
}

async function validateCLientId(client_id){
  const my_query = {
    text: `select client_id from client.account where client_id=$1;`,
    values: [client_id],
  };
  const id = await queryByPromise(my_query);
  return id;
};

async function getPassword(client_id){
   //get old hash password and use bcrypt to compare
   const my_query = {
    text:
    `SELECT password FROM client.account WHERE client_id=$1;`,
    values:[client_id]
  }
  const user_hash_password = await queryByPromise(my_query);

  return user_hash_password.result[0].password;
}

async function getEmail(email){
  const my_query = {
    text:
    `select email from client.account where email=$1;`,
    values:[email]
  };
  const user_email = await queryByPromise(my_query);

  return user_email;
}

async function getPassByEmail(email){
  const my_query = {
    text:
    `SELECT password FROM client.account WHERE email=$1;`,
    values:[email]
  };
  const hash_password = await queryByPromise(my_query);
  return hash_password.result[0].password;
}

module.exports = {
  createUser,
  getClientId,
  storeResetToken,
  getTokenDetails,
  resetPass,
  delToken,
  updateTransAccR,
  getBalance,
  getTranstion,
  getContractSummary,
  getDetails,
  editDetails,
  getFeedPrice,
  updateActiveContract,
  getContractId,
  updateClosedContract,
  validateCLientId,
  getPassword,
  getEmail,
  getPassByEmail
};
