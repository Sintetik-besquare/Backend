CREATE SCHEMA feed;

CREATE TABLE feed.symbol(
    id SERIAL PRIMARY KEY NOT NULL UNIQUE,
    symbol_name VARCHAR (50) NOT NULL UNIQUE
);
CREATE TABLE feed.symbol_price(
    id BIGINT NOT NULL UNIQUE,
    symbol_id SERIAL NOT NULL,
    price NUMERIC (2),
    ts  TIMESTAMP,  
    FOREIGN KEY (symbol_id)
        REFERENCES feed.symbol (id)
);
