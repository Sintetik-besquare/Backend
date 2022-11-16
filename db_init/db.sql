CREATE SCHEMA IF NOT EXISTS feed;

CREATE SCHEMA IF NOT EXISTS client;

CREATE TABLE IF NOT EXISTS feed.symbol(
    id bigserial primary key,
    symbol_name varchar(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS feed.symbol_price(
    id bigserial primary key,
    price numeric(15,2) NOT NULL,
    ts  bigint NOT NULL,  
    symbol_id bigint NOT NULL REFERENCES feed.symbol(id)
);

CREATE TABLE IF NOT EXISTS client.account(
    client_id bigserial primary key,
    first_name varchar(255),
    last_name varchar(255),
    gender varchar(50),
    residence varchar(255),
    occupation varchar(255),
    date_join bigint,
    age numeric(2),
    email varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    education varchar(50),
    balance numeric(10, 2)
);

CREATE TABLE IF NOT EXISTS client.contract_summary(
    contract_id bigserial primary key,
    symbol varchar(100) NOT NULL,
    contract_type varchar(50) NOT NULL,
    option_type varchar(50) NOT NULL,
    duration numeric(3) NOT NULL,
    stake numeric(10, 2) NOT NULL,
    payout numeric(10, 2),
    entry_time bigint NOT NULL,
    exit_time bigint,
    entry_spot numeric(15, 2) NOT NULL,
    exit_spot numeric(15, 2),
    client_id bigint REFERENCES client.account(client_id)
);

CREATE TABLE IF NOT EXISTS client.transaction(
    transaction_id bigserial primary key,
    transaction_time bigint NOT NULL,
    transaction_type character varying(50) NOT NULL,
    transaction_amount numeric(10, 2) NOT NULL,
    balance numeric(10, 2) NOT NULL,
    contract_id bigint REFERENCES client.contract_summary(contract_id),
    client_id bigint REFERENCES client.account(client_id)
);

CREATE TABLE IF NOT EXISTS client.resetPassword(
    id bigserial primary key,
    token varchar(255) NOT NULL,
    created_at  bigint NOT NULL,  
    expired_at bigint NOT NULL, 
    client_id bigint NOT NULL REFERENCES client.account(client_id)
);

CREATE OR REPLACE PROCEDURE storeFeed(
  "name" VARCHAR,
  "price" NUMERIC,
  "time" BIGINT
) 
LANGUAGE plpgsql 
AS $$
BEGIN
  INSERT INTO feed.symbol (symbol_name) VALUES("name") ON CONFLICT DO NOTHING;
  INSERT INTO feed.symbol_price (price,ts,symbol_id) 
  VALUES("price","time",(SELECT id FROM feed.symbol WHERE symbol_name="name"));
  COMMIT;
END;
$$;

CREATE OR REPLACE PROCEDURE updateBalanceAfterReset(
    "transactiontime" BIGINT,
    "transactiontype" VARCHAR,
    "transactionamount" NUMERIC,
    "userbalance" NUMERIC,
    "clientid" BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO client.transaction (transaction_time,transaction_type,transaction_amount,balance,client_id)
    VALUES("transactiontime", "transactiontype","transactionamount","userbalance","clientid");
    UPDATE client.account SET balance = "userbalance" WHERE client_id = "clientid";
    COMMIT;
END;
$$;


CREATE OR REPLACE PROCEDURE updateActiveContract(
    "index" VARCHAR,
    "contracttype" VARCHAR,
    "optiontype" VARCHAR,
    "ticks" NUMERIC,
    "premium" NUMERIC,
    "entrytime" BIGINT,
    "entryspot" NUMERIC,
    "clientid"  BIGINT,

    "transactiontype" VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE client.account SET balance = balance-"premium" WHERE client_id = "clientid";
    
    WITH ins AS (
        INSERT INTO client.contract_summary (symbol,contract_type,option_type,duration,stake,entry_time,entry_spot,client_id)
        VALUES("index","contracttype","optiontype","ticks","premium","entrytime","entryspot","clientid")
        RETURNING contract_id
    )
    INSERT INTO client.transaction (transaction_time,transaction_type,transaction_amount,balance,contract_id,client_id)
    VALUES("entrytime","transactiontype","premium",(SELECT balance FROM client.account WHERE client_id = "clientid"),
    (SELECT contract_id FROM ins),"clientid");
    COMMIT;
END;
$$;

CREATE OR REPLACE PROCEDURE updateClosedContract(
    
    "contrectpayout" NUMERIC,
    "entrytime" BIGINT,
    "exittime" BIGINT,
    "exitspot" NUMERIC,
    "clientid"  BIGINT,
    "contractid" BIGINT,

    "transactiontype" VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE client.account SET balance = balance+"contrectpayout" WHERE client_id = "clientid";
    UPDATE client.contract_summary SET exit_time="exittime", exit_spot="exitspot",payout="contrectpayout" 
    WHERE contract_id="contractid";
    INSERT INTO client.transaction (transaction_time,transaction_type,transaction_amount,balance,contract_id,client_id)
    VALUES("exittime","transactiontype","contrectpayout",(SELECT balance FROM client.account WHERE client_id = "clientid"),
    "contractid","clientid");
    COMMIT;
END;
$$;

