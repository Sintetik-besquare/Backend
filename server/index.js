const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');

//list of all available routes
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const dbRouter = require('./routes/db');
const decode = require('./middlewares/jwt');


//get port from environment and store in Express. 
const port = 3001;
const app = express(); 

//use cors() to allow backend server data be accessed by frontend server
app.use(cors());

//log all request and error in development mode
//this might need to move the very begining of route declaration
app.use(morgan('dev'));

//allow user to send req jason format
app.use(express.json());
//allow user to send req in nested jason format
app.use(express.urlencoded({extended: true}))

//API endpoint example
app.use('/signup',dbRouter);
app.use('/user',userRouter);

//Error for invalid API endpoint
app.use('*', (req, res) => {
    return res.status(404).json({
      success: false,
      message: 'API endpoint doesnt exist'
    })
  });

//create backend server
const server = http.createServer(app);
//backend server is listening on port 3001
server.listen(port,()=>{
    console.log(`Server is running on ${port}`)
});
