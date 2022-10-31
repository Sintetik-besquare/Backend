--CREATE DATABASE sintetik;
CREATE SCHEMA feed;

CREATE TABLE symbol_price(
    symbol_name VARCHAR(255),
    ts  TIMESTAMP,
    price NUMERIC (2)  
);

