const User = require("../models/user.schema");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const cookieOptions = require("../config/cookie");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS);

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with a strong secret");
}

if (!Number.isInteger(JWT_EXPIRES_IN_SECONDS) || JWT_EXPIRES_IN_SECONDS <= 0) {
  throw new Error("Invalid JWT expiration configuration");
}

function generateToken(user, res) {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
  });
  return;
}
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.validatedBody;

  const user = await User.create({
    name,
    email,
    password,
    
  });

  generateToken(user, res);
   return res.status(201).json({
        status: "success",
        data: {
            user: {
               
                name: user.name,
                email: user.email,
               
            },
        },
    });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.validatedBody;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  generateToken(user, res);
   return res.status(200).json({
        status: "success",
        data: {
            user: {
               
                name: user.name,
                email: user.email,
                
            },
        },
    });
};

exports.logoutUser = async (req, res) => {
  res.clearCookie("token", cookieOptions);

    return res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
};
