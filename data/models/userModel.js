var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    password: String,
    last_location: String
});

UserSchema.index({username: 1}, {unique: true});

module.exports = mongoose.model("User", UserSchema);