var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//rating value checked by business service
var reviewSchema = new Schema({
    mediaId: String,
    userId: String,
    text: String,
    rating: Number,
    type: String,
    username: String,
    mediaName: String
});

reviewSchema.index({mediaId: 1, userId: 1, type: 1}, {unique: true});

module.exports = mongoose.model("Review", reviewSchema);