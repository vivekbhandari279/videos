import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

import connectDB from "../db/index.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is listing on port ${process.env.PORT}`);
    });
    app.on("error", (err) => {
        console.log(`Error : ${err}`);
        throw err;
    });
  })
  .catch((err) => {
    console.log(`Database connection failed !! ${err}`);
  });