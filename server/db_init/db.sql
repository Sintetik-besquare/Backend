CREATE SCHEMA users;

 CREATE TABLE users.user(
   user_id SERIAL PRIMARY KEY NOT NULL UNIQUE,
   first_name VARCHAR (50),
   last_name VARCHAR (50),
   gender VARCHAR (10),
   country VARCHAR (50),
   joined_date TIMESTAMP,
   email VARCHAR (50) UNIQUE NOT NULL,
   password VARCHAR (50) NOT NULL
 );

 CREATE TABLE users.contract(
    contract_id BIGINT NOT NULL UNIQUE,
    user_id SERIAL NOT NULL UNIQUE,
    symbol_id SERIAL NOT NU UNIQUE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    entry_price NUMERIC(2),
    exit_price NUMERIC(2),
    duration INT,
    contract_type VARCHAR(50),
    win_loss_flag BYTEA,
    profit NUMERIC(2),
    stake NUMERIC(2),
    payout NUMERIC(2)

    FOREIGN KEY (user_id)
        REFERENCES users.user (user_id);
 )

CREATE TABLE users.transaction(
    user_id SERIAL PRIMARY KEY NOT NULL,
    transaction_id BIGINT PRIMARY KEY NOT NULL UNIQUE,
    transaction_type VARCHAR(10),
    ts TIMESTAMP,
    currency VARCHAR(50),
    debit_debit NUMERIC(2),
    balance NUMERIC(2)

    FOREIGN KEY (user_id)
        REFERENCES users.user (user_id);
)

CREATE TABLE users.symbol(
    id SERIAL PRIMARY KEY NOT NULL
    symbol_name VARCHAR (50) NOT NULL UNIQUE
)
