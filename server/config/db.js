const mongoose = require('mongoose')

const connetDB = async ()=>{
  try{
      
      await mongoose.connect(process.env.MONGO_URI)
      console.log('MongoDB connected...')
  }catch(e){
    console.log(`DB error ${e.message}`);
    process.exit(-1)
  }
}

module.exports=connetDB;