require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator')

var app = express();
var port = process.env.PORT;

var route = "/v1";  //like /v1/adapter
var userRoutes = require("./routes/adapterRoutes.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(route, userRoutes);



app.get('*', function (req, res) {
    res.status(404).json({success: false, "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.post('*', function (req, res) {
    res.status(404).json({ success: false, "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.put('*', function (req, res) {
    res.status(404).json({ success: false, "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})
app.delete('*', function (req, res) {
    res.status(404).json({ success: false, "errors": [{ "msg": req.method + " on " + req.originalUrl + " is not defined" }] })
})

app.listen(port);

console.log("Adapter service started at: http://localhost:" + port);