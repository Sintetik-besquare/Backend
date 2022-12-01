//connect db
const { queryByPromise } = require("../dbconfig/db");

async function createUser(email, hash, initial_balance, date_join) {
  //store user email & password to db
  console.log('real creatuser called');
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

async function storeResetToken(user_id,token,created_time,expired_time){
  //store token into db
  const my_query2 = {
  text: `INSERT INTO client.resetPassword (client_id, token, created_at, expired_at)
  VALUES($1,$2,$3,$4) 
  RETURNING id;`,
  values: [
    user_id,
    token,
    created_time,
    expired_time,
  ],
};
const id = await queryByPromise(my_query2);
return id.result[0].id;
}

async function getTokenDetails(id, token){
  //check whether link is valid
  const my_query = {
    text: `SELECT client_id, expired_at FROM client.resetPassword 
  WHERE id=$1 AND token=$2;`,
    values: [id, token],
  };
  const check = await queryByPromise(my_query);

  return check;
};

async function resetPassF(hash,user_id){
  //reset user password
  const my_query = {
    text: `UPDATE client.account SET password = $1 WHERE client_id= $2;`,
    values: [hash, user_id],
  };
  await queryByPromise(my_query);
}

async function delToken(id,token){
   //after reset password delete token
   const my_query = {
    text: `DELETE FROM client.resetPassword WHERE id= $1 AND token=$2;`,
    values: [id, token],
  };
  await queryByPromise(my_query);
}

module.exports = {
    createUser,
    getClientId,
    storeResetToken,
    getTokenDetails,
    resetPassF,
    delToken
};
