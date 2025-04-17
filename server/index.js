const app = require('./app');  //Creatin app
const connectDB = require('./config/db');   //Connecting to DataBase

const PORT = process.env.PORT || 5000;

// Connect Mongo and start server
connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
