import mongoose from "mongoose"
import { DB_NAME } from "../src/constants.js";

 const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MONGO database connection successfull !! ${connectionInstance.connection.host}`);
    } catch (err) {
        console.error("MONGO database connection failed!!:", err);
        process.exit(1);
    }
}

export default connectDB;