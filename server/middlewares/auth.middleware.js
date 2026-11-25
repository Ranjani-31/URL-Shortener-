const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        
        if (!token) {
           
            throw new AppError("Authentication failed. Token not found.", 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            
            throw new AppError("Authentication failed. User not found.", 401);
        }

       req.user = {
  id: decoded.userId,
  plan: user.plan,
};
        next();
        
    } catch (error) {
       
        next(error); 
    } 
};

module.exports = authenticate; 