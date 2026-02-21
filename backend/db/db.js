import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
       await mongoose.connect(URI);
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error connecting to MongoDB");
        console.log(error);
        process.exit(1);
    }
};
export default connectDB;