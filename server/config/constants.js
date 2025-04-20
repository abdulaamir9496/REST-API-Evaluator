// This file contains constants used in the application.
// It exports an object with the following properties:
// PORT: The port number on which the server will listen.
// MONGO_URI: The MongoDB connection string.
// DEFAULT_AUTH_KEY: The default authorization header key.
// DEFAULT_AUTH_VALUE: The default authorization header value.
// API_KEY: The API key for authentication.
// BASIC_AUTH_USER: The username for basic authentication.
// BASIC_AUTH_PASS: The password for basic authentication.
// OAUTH_CLIENT_ID: The client ID for OAuth authentication.
// OAUTH_CLIENT_SECRET: The client secret for OAuth authentication.
module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    DEFAULT_AUTH_KEY: process.env.DEFAULT_AUTH_KEY || 'Authorization',
    DEFAULT_AUTH_VALUE: process.env.DEFAULT_AUTH_VALUE || 'Bearer YOUR_TOKEN_HERE',
    API_KEY: process.env.API_KEY,
    BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
    BASIC_AUTH_PASS: process.env.BASIC_AUTH_PASS,
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
};  