require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');

const historicalFeedRouter = require('./routes/historical_feed');

const port = 3002;
const app = express(); 

//log all request and error in development mode
//this might need to move the very begining of route declaration
app.use(morgan('dev'));
app.use(cors());
//allow user to send req jason format
app.use(express.json());
//allow user to send req in nested jason format
app.use(express.urlencoded({extended: true}))

//API endpoint 
app.use('/feed',historicalFeedRouter);

//Error for invalid API endpoint
app.use('*', (req, res) => {
    return res.status(404).json({
      success: false,
      message: 'API endpoint doesnt exist'
    })
  });

const Redis = require('ioredis');

const env = process.env;
const redis = new Redis({
    host:'redis',
    port:env.REDIS_PORT
});

//create feed server
const server = http.createServer(app);

//attach http server to socket.io
const io = require('socket.io')(server,{
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
  });

//connect to socketio 
io.on('connection', async (socket)=>{
  socket.on("socket1",(arg)=>{
    console.log(arg);
  })
  console.log("Client connected!!!!",socket.id);

  //get selected symbol from frontend
  //multiple subscribe channel
  await redis.subscribe("price feed");
  await redis.on("message",(channel,message)=>{

    socket.emit("getfeed",message);
    //frontend will socket.on("selected channel")
     
      });
    socket.on("disconnect",async ()=>{
      console.log("Client disconnected");
    })  
    
  });

//feed server is listening on port 3002
server.listen(port,()=>{
    console.log(`Server is running on ${port}`)
});

