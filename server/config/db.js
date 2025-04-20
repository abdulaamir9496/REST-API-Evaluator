const mongoose = require("mongoose");
const { MONGO_URI } = require("./constants");

// Connect to MongoDB
// This function connects to the MongoDB database using Mongoose.
// It uses the connection string stored in the MONGO_URI constant.
// If the connection is successful, it logs a success message.
// If the connection fails, it logs the error message and exits the process.
// The function is exported for use in other parts of the application.
// The function is asynchronous, meaning it returns a promise.
// It uses try-catch for error handling.
// The connection options include useNewUrlParser and useUnifiedTopology.
// These options are recommended for better compatibility with the MongoDB driver.
// The function is called when the application starts to establish the database connection.
// The connection is established using the mongoose.connect method.
// The connection URI is stored in the MONGO_URI constant.
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
