require("dotenv").config();
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cors = require("cors");
const { queryByPromise } = require("./dbconfig/db");

//list of all available routes
const userRouter = require("./routes/user");
const accountRouter = require("./routes/account");
//get port from environment and store in Express.
const port = 3001;
const app = express();

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
  return res.status(404).json({
    success: false,
    message: "API endpoint doesnt exist",
  });
});
//create backend server
const server = http.createServer(app);

//attach http server to socket.io
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//Todo: add authentication to socketio
const jwt = require("jsonwebtoken");

io.use(async (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    next(new Error("Request is not authorized"));
  }
  try {
    //get client_id from payload
    const { client_id } = jwt.verify(token, process.env.SECRET);
    
    //check whether the client_id exist in db
    const my_query = {
      text:
      `select client_id from client.account where client_id=$1;`,
      values:[client_id]
    }
    const id = await queryByPromise(my_query);

    //pass client_id to sokect on connection
    socket.data = id.result[0].client_id;
    next();
  } catch (error) {
    console.log(error);
    next(new Error("Request is not authorized"));
  }
});
const Contract = require("./socketio/contract");

//connect to socketio
//dunno why sometimes last entry of redis stream is empty
io.on("connection", async (socket) => {
  console.log("Client connected!!!!");
  //get client id from payload
  const client_id = socket.data;

  socket.on("order", async (data) => {
    let { index, stake, ticks, option_type, entry_time } = data;
    //console.log(data);
    //to test
    // let current_time = Math.floor(Date.now() / 1000);
    // const contract = new Contract(
    //   "Vol100",
    //   client_id,
    //   "call",
    //   15,
    //   5,
    //   current_time
    // );
    // actual code
      const contract = new Contract(
      index,
      client_id,
      option_type,
      stake,
      ticks,
      entry_time
    );

    let buy_contract = await contract.buy();
    //during buy event just send bk contract id and status
    // console.log(buy_contract);
    socket.emit("buy", buy_contract);
    
    if(buy_contract.status){
    //depend on ticks keep update isWinning status and profit/lost
    let timesRun = 0;
    let interval = setInterval(async function () {
      timesRun += 1;
      
      //update whether contract is Wining
      let status = await contract.checkStatus();
      socket.emit("iswinning", status);

      //sell contract after contract expire
      if (timesRun === ticks) {
        let sell_contract = await contract.sell();
        socket.emit("sell",sell_contract);
        clearInterval(interval);

        
      }
    }, 1000);


    }
   
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

//backend server is listening on port 3001
server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
