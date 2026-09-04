import mongoose from "mongoose";
import dns from "dns";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URI) {
    return console.log("MONGODB_URI is not defined");
  }

  if (isConnected) {
    return console.log("=> using existing database connection");
  }

  try {
    dns.setDefaultResultOrder("ipv4first");
    dns.setServers(["1.1.1.1", "1.0.0.1"]);

    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};