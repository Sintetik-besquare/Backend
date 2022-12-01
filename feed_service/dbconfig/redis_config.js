const Redis = require("ioredis");
const env = process.env;
const redis = new Redis({
  host: "redis",
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
});

module.exports = redis;