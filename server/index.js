const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const { PORT } = require("./config/constants");

// Connect to DB and start server
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
