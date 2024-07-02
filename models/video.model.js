import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: [true, "Title is required"],
        trim: true,
    },
    videoFile: {
        type: String,   // Cloudinary url
        required: [true, "Video File is required"],
        trim: true,
    },
    thumbnail: {
        type: String,   // Cloudinary url
        required: [true, "Thumbnail is required"],
        trim: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    duration: {
        type: String,
        default: "00:00",
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema)