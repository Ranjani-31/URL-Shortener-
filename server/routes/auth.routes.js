const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const cookieOptions = require("../config/cookie");
const router = express.Router();
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

// Ensure the Passport config is loaded
require('../utils/passport'); 

// 1. The route triggered by your React button (Starts the flow)
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false 
  })
);

// 2. The callback route Google redirects to (Finishes the flow)
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${frontendUrl}/login`,
    session: false 
  }),
  (req, res) => {
    // If successful, Passport attaches the user data to req.user
    const token = jwt.sign(
      { userId: req.user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Set the JWT in an HTTP-only cookie (just like your standard login)
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: Number(process.env.JWT_EXPIRES_IN_SECONDS || 604800) * 1000,
    });

    // Redirect the user back to your React dashboard
    res.redirect(`${frontendUrl}/dashboard`);
  }
);

module.exports = router;