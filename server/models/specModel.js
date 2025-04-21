// models/Spec.js
const mongoose = require("mongoose");

const specSchema = new mongoose.Schema({
    name: String, // file name or remote URL
    type: {
        type: String,
        enum: ["file", "url"],
        required: true,
    },
    path: String, // local file path for type=file
    url: String,  // for type=url
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Spec", specSchema);
