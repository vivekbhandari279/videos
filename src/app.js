import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();

/**
 * user to prevent Cross Origin Resource Sharing
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

/**
 * Middleware to check what type of data we are receiving and how much quantity we are allowing.
 */// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.json({ limit: "16kb" })); // For data handlinig from form.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // For data handlinig from url.
app.use(express.static("public")); // to serve local static files.
app.use(cookieParser()); // To read some secure cookies, which is access by server only.

app.get("/", (req, res) => {
  res.send(`<h1>Dentganga product api Page on port: ${process.env.PORT}</h1>`);
});

// Routes import
import userRouter from "../routes/user.route.js";




// Routes declaration
app.use("/api/v1/users", userRouter);









export default app;
