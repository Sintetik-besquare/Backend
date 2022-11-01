CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE users.credential(
    user_id SERIAL PRIMARY KEY,
    email VARCHAR ( 255 ) UNIQUE NOT NULL,
    password VARCHAR ( 255 ) NOT NULL
);

--example
-- CREATE TABLE sintetik.account(
--     user_id SERIAL PRIMARY KEY,
--     username VARCHAR ( 50 ) NOT NULL,
--     email VARCHAR ( 255 ) UNIQUE NOT NULL,
--     password VARCHAR ( 50 ) NOT NULL,
--     created_on TIMESTAMP NOT NULL,
--     last_login TIMESTAMP 
-- );

-- CREATE TABLE sintetik.roles(
--    role_id serial PRIMARY KEY,
--    role_name VARCHAR (255) NOT NULL
-- );

-- CREATE TABLE sintetik.account_roles (
--   user_id INT NOT NULL,
--   role_id INT NOT NULL,
--   grant_date TIMESTAMP,
--   PRIMARY KEY (user_id, role_id),
--   FOREIGN KEY (role_id)
--       REFERENCES sintetik.roles (role_id),
--   FOREIGN KEY (user_id)
--       REFERENCES sintetik.account (user_id)
-- );