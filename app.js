const express = require("express");
const morgan = require("morgan");
const cors = require('cors')

require('dotenv').config();
require('express-async-errors');
//whenever app.js will run it will execute below line and database will be connected.
require("./db");

const userRouter = require("./routes/user");
const actorRouter = require("./routes/actor");
const movieRouter = require("./routes/movie");
const reviewRouter = require("./routes/review");
const adminRouter = require("./routes/admin");

const { handleNotFound } = require("./utils/helper");
const app = express();

app.use(morgan("dev"));

// to convert incoming data into JSON format
app.use(express.json());

//fix cors error
app.use(cors());

//use external router in app
app.use("/api/user",userRouter);
app.use("/api/actor",actorRouter);
app.use("/api/movie",movieRouter);
app.use("/api/review",reviewRouter);
app.use("/api/admin",adminRouter);




app.use('/*',handleNotFound)

//to handle errors
app.use((err,req,res,next) =>{
    res.status(500).json({error : err.message || err});
});


//listen method is use to listen a paricular port,callback function will run once this connection
//is made.
app.listen(8000,()=>{
    console.log("the port is listening on port 8000");
});