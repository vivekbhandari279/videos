import mongoose, { Schema } from "mongoose";

const tweetSchema = new mongoose.Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    content: {
        type: String,
        trim: true,

    }
});

export const Tweet = new mongoose.model("Tweet", tweetSchema);