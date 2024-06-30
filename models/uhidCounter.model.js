import mongoose from "mongoose";

const uhidCounterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    seq: {
        type: Number,
        default:0
    }
});

export const UhidCounter = new mongoose.model("UhidCounter", uhidCounterSchema);