const mongoose = require('mongoose');

//connect database
// const url = "mongodb://localhost:27017/movieApp"
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Database is connected !');
    })
    .catch((err) => {
        console.log('Database connection failed : ', err);
    });