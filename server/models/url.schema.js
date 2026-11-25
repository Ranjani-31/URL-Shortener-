const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
    userId:{
     type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalUrl: {
        type: String,
        required: true,       

    },
    
    shortCode: {
        type: String,
        unique: true,
    },
    clickCount: {
        type:Number,
        default:0
    },
    isActive:{
        type:Boolean,
        required:true,
        default:true
    },
 createdAt: {
        type: Date,
        default: Date.now,
    },
    
    expiresAt: {
        type: Date,


    }


})

module.exports = mongoose.model('Url', urlSchema)