require('dotenv').config();
var express = require('express');
var expressValidator = require('express-validator')
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT;
var dbUrl = process.env.DATABASE;   //moongoose connection url
var route = "/v1";  
var mediaRoutes = require("./routes/mediaRoutes.js");
var reviewRoutes = require("./routes/reviewRoutes.js");


// mongoose instance 
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(route, mediaRoutes, reviewRoutes);



app.get('*', function (req, res) {
    res.status(404).json({ "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.post('*', function (req, res) {
    res.status(404).json({ "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.put('*', function (req, res) {
    res.status(404).json({ "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.delete('*', function (req, res) {
    res.status(404).json({ "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})

app.listen(port,'0.0.0.0');

console.log("Data service started at: http://localhost:" + port);