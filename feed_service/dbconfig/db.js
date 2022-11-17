const pg = require('pg');
const { Pool } = pg;
const  config  = require('./db_config.js');
const db_config = config.db;
const connectionString = 'postgresql://'+db_config.user+':'+db_config.password+'@'+db_config.host+':'+db_config.port+'/'+db_config.database;
const pool = new Pool({connectionString});

//function to connect to database and make query
async function queryByPromise(query) {
    let response = {};
    await pool
    .connect()
    .then(client => {
      return client
        .query(query)
        .then(res => {
          client.release()
          response.result = res.rows
        })
        .catch(err => {
          client.release()
          console.log(err.stack)
          response.error = e.stack
        })
    });
    return response;
  }
  
  module.exports = { queryByPromise };