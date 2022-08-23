require('dotenv').config();
var express = require('express');
var expressValidator = require('express-validator')
//var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT;
var dbUrl = process.env.DATABASE;   //moongoose connection url
var route = "/v1/";  
var businessRoutes = require("./routes/orchestrationRoutes.js");


// mongoose instance 
// mongoose.Promise = global.Promise;
// mongoose.connect(dbUrl); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(route, businessRoutes);
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError) {
      // Catch bad JSON.
      res.status(404).json({success: false, errors: [{"msg": "Bad json format"}]});
    } else {
      next();
    }
  });


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

app.listen(port);

console.log("Orchestration service started at: http://localhost:" + port);