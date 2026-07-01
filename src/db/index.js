import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

// Mongodb Atlas ruuning from dhruvin.codes@gmail.com

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `\n ##### DB connected successfully !! ##### ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`\n ##### DB connection error #####`, error);
    process.exit(1);
  }
};

export default connectDB;
