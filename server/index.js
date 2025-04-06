const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const SwaggerParser = require("@apidevtools/swagger-parser");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/oas/test", async (req, res) => {
  try {
    const { oasUrl } = req.body;
    const api = await SwaggerParser.validate(oasUrl);

    const results = [];

    for (const [path, methods] of Object.entries(api.paths)) {
      for (const [method, config] of Object.entries(methods)) {
        if (["get", "post"].includes(method)) {
          const url = `${api.servers?.[0]?.url || ""}${path}`;
          const request = {
            method,
            url,
            headers: {},
            data: {}
          };

          try {
            const response = await axios(request);
            results.push({
              path,
              method,
              status: response.status,
              response: response.data
            });
          } catch (error) {
            results.push({
              path,
              method,
              status: error.response?.status || 500,
              error: error.message
            });
          }
        }
      }
    }

    res.json({ summary: { total: results.length }, results });
  } catch (error) {
    res.status(400).json({ message: "Invalid OAS", error: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const cors = require("cors");

// dotenv.config();
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// const oasRoutes = require("./routes/oasRoutes");
// app.use("/api/oas", oasRoutes);

// // DB & Server
// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/oastest";

// mongoose
//   .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log("MongoDB connected");
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch(err => console.error("MongoDB connection error:", err));
