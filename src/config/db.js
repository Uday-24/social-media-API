const mongoose = require('mongoose');

exports.connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo DB Connected');
    }catch(err){
        console.log('Unable to connect with database');
        process.exit(1);
    }
}