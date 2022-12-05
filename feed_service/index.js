require("dotenv").config();
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cors = require("cors");
const redis = require("./dbconfig/redis_config");
const historicalFeedRouter = require("./routes/historical_feed");

const port = 3002;
const app = express();

//log all request and error in development mode
app.use(morgan("dev"));
//use cors() to allow backend server data be accessed by frontend server
app.use(cors());
//allow user to send request in json format
app.use(express.json());
//allow user to send request in nested json format
app.use(express.urlencoded({ extended: true }));

//API endpoint
app.use("/feed", historicalFeedRouter);

//Error for invalid API endpoint
app.use("*", (req, res) => {
  return res.status(404).json({
    message: "API endpoint doesnt exist",
  });
});

const server = http.createServer(app);

//attach http server to socket.io
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//connect to socketio
io.on("connection", async (socket) => {
  console.log("Client connected!!!!");
  function checkIndex(index) {
    //check ticks
    let index_list = ["VOL20", "VOL40", "VOL60", "VOL80", "VOL100", "VOL200"];
    let found = index_list.some((i) => i === index);
    if (!found) {
      return {
        errors:
          "Index can only be VOL20, VOL40, VOL60, VOL80, VOL100 or VOL200",
      };
    }
  }

  function sendFeed(channel, message) {
    socket.emit("feed", message);
  }

  try {
    //get selected index from client
    socket.on("index", async (data) => {
      let { index } = data;

      //check whether the index is valid index
      const index_not_found = checkIndex(index);
      if (index_not_found) {
        socket.emit("feed", index_not_found);
      }

      await redis.subscribe(index);
    });

    await redis.on("message", sendFeed);

    socket.on("disconnect", async () => {
      await redis.removeListener("message", sendFeed);
      console.log("Client disconnected");
    });

  } catch (error) {
    console.log(error);
  }
});

//feed server is listening on port 3002
server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
