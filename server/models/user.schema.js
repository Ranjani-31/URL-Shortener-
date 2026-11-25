const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
           },
    email: {
        type:String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type:String,
        select:false,
    }, 
   googleId:{
    type:String
   },
   plan:{
   type: String,
   default: "free",
   enum: ["free", "pro", "premium"]
   },
   planActivatedAt: {
    type: Date,
   },
   apiKeyHash: {
   type: String,
   select: false,
   },
   apiKeyPrefix: {
   type: String,
   },
}, {timestamps: true});

userschema.pre("save", async function() {
    if(!this.isModified("password") || !this.password) return ;
    this.password = await bcrypt.hash(this.password, 10);
    
});

module.exports = mongoose.model("User", userschema);