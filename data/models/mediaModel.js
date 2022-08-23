var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var mediaSchema = new Schema({
    mediaId: String,
    userId: String,
    genres: [Number],
    title: String,
    image: String,
    status: String,
    type: String,
});

mediaSchema.index({mediaId: 1, userId: 1, type: 1}, {unique: true});

module.exports = mongoose.model("Medias", mediaSchema);