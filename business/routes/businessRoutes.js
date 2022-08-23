const express = require("express");
const router = express.Router({mergeParams: true});
const {check, validationResult} = require("express-validator/check");
var businessController = require("../controllers/businessController");
const jwt = require('jsonwebtoken');

let accessTokenSecret = process.env.JWT_KEY;


const authenticateJWT = (req, res, next) => {
    //console.log(req)
    const authHeader = req.headers.authorization;
    //console.log(req.headers);
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ succes: false, errors: [{"msg": 'FORBIDDEN'}]})
            }
            next();
        });
    } else {
        console.log("DENIED");
        res.status(401).json({ succes: false, errors: [{"msg": 'ACCESS DENIED'}]})
    }
}

router.get("/getUserPage/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    try{
        businessController.getUserPage(request)
        .then(result => {
            res.status(200).json({success: true, result: result});
        })
        .catch(error =>{
            console.error("businessRoutes.js error: getUserPage");
            //console.error(error);
            if(error.code){
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            }else{
                res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
            }
            
        })
    }catch(e){
        console.log("error")
    }    
});

router.get("/getMediaPage/:userId/:type/:mediaId/:ip", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.type = req.params.type;
    request.mediaId = req.params.mediaId;
    //
    request.ip = req.params.ip;
    //
    // request.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // if (request.ip.substr(0, 7) == "::ffff:") {
    //     request.ip = request.ip.substr(7)
    // }

    //console.log(request.ip)
    try{
        businessController.getMediaPage(request)
        .then(result => {
            res.status(200).json({successs: true, result: result});
        })
        .catch(error =>{
            console.error("businessRoutes.js error: getMediaPage");
            console.error(error);
            if(error.code){
                console.log(error.code)
                res.status(error.code).json({success: false, errors: [error]})
            }else{
                res.status(500).json({success: false, errors: [error]})
            }
            
        })
    }catch(e){
        console.log("error")
    }    
});

router.get("/getEpisodes/:mediaId", authenticateJWT, (req, res) => {
    let request = {};
    request.mediaId = req.params.mediaId;
    try{
        businessController.getEpisodes(request)
        .then(result => {
            res.status(200).json({successs: true, result: result});
        })
        .catch(error =>{
            console.error("businessRoutes.js error: getEpisodes");
            console.error(error);
            if(error.code != null){
                res.status(error.code).json({success: false, errors: [error]})
            }else{
                res.status(500).json({success: false, errors: [error]})
            }
            
        })
    }catch(e){
        console.log("error")
    }    
});

router.post("/addMedia", authenticateJWT, (req, res) => {
    //console.log(req.body)
    try{
        businessController.addMedia(req.body)
        .then(result => {
            //console.log(result)
            res.status(200).json({successs: true, result: result});
        })
        .catch(error =>{
            console.error("businessRoutes.js error: addMedia");
            console.error(error);
            let err = {};
            err.msg = error.msg;
            res.status(error.code).json({success: false, errors: [err]})
        })
    }catch(e){
        console.log("error")
    }    
});


module.exports = router;