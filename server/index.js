require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');

//list of all available routes
const userRouter = require('./routes/user');
const historicalFeedRouter = require('./routes/historical_feed');
//get port from environment and store in Express. 
const port = 3001;
const app = express(); 

//log all request and error in development mode
//this might need to move the very begining of route declaration
app.use(morgan('dev'));

//allow user to send req jason format
app.use(express.json());
//allow user to send req in nested jason format
app.use(express.urlencoded({extended: true}))

//API endpoint example
app.use('/user',userRouter);
app.use('/feed',historicalFeedRouter);

//Error for invalid API endpoint
app.use('*', (req, res) => {
    return res.status(404).json({
      success: false,
      message: 'API endpoint doesnt exist'
    })
  });

  const Redis = require('redis');
  const redis = new Redis.createClient({
    socket: {
    host:'localhost',
    port:6379,
    }
  });

//create backend server
const server = http.createServer(app);

//attach http server to socket.io
const io = require('socket.io')(server,{
  cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
});

( async () => {
  await redis.connect();
  await redis.subscribe("price feed", (message)=>{
    console.log(message);
  });
})();

//connect to socketio 
io.on('connection',(socket)=>{
  console.log("Client connected!!!!");
  ( async () => {
    await redis.subscribe("price feed", (message)=>{
      socket.emit("getfeed",message);
    });
  })();
  socket.on("disconnect",()=>{
        console.log("Client disconnected")
  })  
});

//backend server is listening on port 3001
server.listen(port,()=>{
    console.log(`Server is running on ${port}`)
});
