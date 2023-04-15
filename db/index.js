const mongoose = require('mongoose');

//connect database
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Database is connected !');
    })
    .catch((err) => {
        console.log('Database connection failed : ', err);
    });

