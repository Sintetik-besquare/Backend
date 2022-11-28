require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const { queryByPromise } = require("./dbconfig/db");
const fs = require("fs");
const path = require("path");
const publicKey = fs.readFileSync(path.join(__dirname, "./jwt_certs/public.pem"), "utf8");
const { decrypt } = require("./utils/crypto");
const redis=require('./dbconfig/redis_config');

const errorHandler = require("./middlewares/errorHandler");

//list of all available routes
const userRouter = require("./routes/user");
const accountRouter = require("./routes/account");

//get port from environment and store in Express.
const port = 3001;

let app = express();

//use cors() to allow backend server data be accessed by frontend server
app.use(cors());

//log all request and error in development mode
//this might need to move the very begining of route declaration
app.use(morgan("dev"));

//allow user to send req jason format
app.use(express.json());
//allow user to send req in nested jason format
app.use(express.urlencoded({ extended: true }));

//API endpoints
app.use("/user", userRouter);
app.use("/account", accountRouter);

//Error for invalid API endpoint
app.use("*", (req, res) => {
  res.status(404).json({
    message: "API endpoint doesnt exist",
  });
});

//error handling 
app.use(errorHandler);

//create backend server
app = http.createServer(app);
module.exports = app;
//attach http server to socket.io
const io = require("socket.io")(app, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//Authentication for socket connection
const jwt = require("jsonwebtoken");

io.use(async (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    const error = new Error("JWT must be provided");
    next(error);
  }
  try {
     //check whether the token is in blacklist
     const inBlackList = await redis.get(`bl_${token}`);
     if (inBlackList) {
      const error = new Error("Invalid JWT token");
      next(error);
     };
 
    //get client_id from payload
    let { client_id } = jwt.verify(token, publicKey, {
      expiresIn: "1d",
      algorithm: "RS256",
    });
    client_id = decrypt(client_id);
    
    //check whether the client_id exist in db
    const my_query = {
      text: `select client_id from client.account where client_id=$1;`,
      values: [client_id],
    };
    const id = await queryByPromise(my_query);

    //pass client_id to sokect on connection
    socket.data = id.result[0].client_id;
    next();

  } catch (error) {
    next(error);
  }
});
const Contract = require("./socketio/contract");

//connect to socketio
io.on("connection", async (socket) => {
  console.log("Client connected!!!!");

  //get client id from payload
  const client_id = socket.data;

  socket.on("order", async (data) => {
    try{
      let { index, stake, ticks, option_type, contract_type, entry_time } = data;

      const contract = new Contract(
        index,
        client_id,
        option_type,
        contract_type,
        stake,
        ticks,
        entry_time
      );

      //buy contract
      let buy_contract = await contract.buy();
      //during buy event just send bk contract id and status
      socket.emit("buy", buy_contract);

      if (buy_contract.status) {
        //depend on ticks keep update isWinning status and profit/lost
        let timesRun = 0;
        let interval = setInterval(async function () {
          timesRun += 1;

          //update whether contract is Wining
          let status = await contract.checkStatus(timesRun);
          socket.emit("iswinning", status);

          //sell contract after contract expired
          if (timesRun === ticks) {
            let sell_contract = await contract.sell();
            socket.emit("sell", sell_contract);
            clearInterval(interval);
          }
        }, 1000);
      }
    }catch(error){
      console.log(error);
    };
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// backend server is listening on port 3001
const server = app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
