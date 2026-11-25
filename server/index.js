const express = require('express');
const cookieParser = require('cookie-parser');
const dns = require('dns');
const cors = require('cors');
require('dotenv').config();
const notFound = require("./middlewares/notFound");


const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());


dns.setDefaultResultOrder('ipv4first');
dns.setServers(["8.8.8.8"]); 
 
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));



app.use("/", require("./routes"));

app.use(notFound);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : "An unexpected server error occurred.";

  if (statusCode >= 500) {
    console.error("Request failed:", error);
  }

  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message,
  });
});


module.exports = app;