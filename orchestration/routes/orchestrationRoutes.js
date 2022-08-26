const express = require("express");
const router = express.Router({mergeParams: true});
const {check, validationResult} = require("express-validator/check");
var orchestrationController = require("../controllers/orchestrationController");
const jwt = require('jsonwebtoken');
let authSecret = process.env.JWT_AUTH;

//get ip and token
const middleware = (req, res, next) => {
    req.body.ip = req.connection.remoteAddress;
    req.params.ip = req.body.ip;
    if (req.body.ip.substr(0, 7) == "::ffff:") {
        req.body.ip = req.ip.substr(7);
        req.params.ip = req.body.ip;
    }
    if(req.headers.authorization != null){
        req.body.token = req.headers.authorization.split(' ')[1];
    }
    next();
}

const authenticateJWT = (req, res, next) => {
    //console.log(req)
    const authHeader = req.headers.authorization;
    //console.log(req.headers);
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        // console.log(token)
        jwt.verify(token, authSecret, (err, user) => {
            if (err) {
                console.log(err)
                return res.status(401).json({ succes: false, errors: [{"msg": 'ACCESS DENIED'}]})
            }
            req.params.userId = user._id;
            req.body.userId = user._id;

            next();
        });
    } else {
        //console.log("DENIED");
        res.status(403).json({ succes: false, errors: [{"msg": 'ACCESS DENIED'}]})
    }
}

router.post("/register", [
    check("username", "username is not defined").exists(),
    check("password", "password is not defined").exists()
    ], middleware, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            orchestrationController.register(req.body)
            .then(result => {
                console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                //console.error("Orchestration.js error: register");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
       
});

router.post("/login", [
    check("username", "username is not defined").exists(),
    check("password", "password is not defined").exists()
    ], middleware, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            orchestrationController.login(req.body)
            .then(result => {
                console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                //console.error("Orchestration.js error: register");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
       
});

router.post("/logout", middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            orchestrationController.logout(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                //console.error("Orchestration.js error: register");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
       
});

router.get("/refreshToken", middleware, (req, res) => {
        orchestrationController.refreshToken(req.body)
        .then(result => {
            //console.log(result)
            res.status(200).json({success: true, result: result});
        })
        .catch(error =>{
            //console.error("Orchestration.js error: register");
            console.error(error);
            res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
        })
        
});

router.get("/getHomePage", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    orchestrationController.getUserPage(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: getUserPage");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/getUserPage/:id", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.id;
    orchestrationController.getUserPage(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: getUserPage");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/getPageByUsername/:username", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.username = req.params.username;
    orchestrationController.getPageByUsername(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: getUserPage");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/getMediaPage/:type/:mediaId", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.mediaId = req.params.mediaId;
    request.type = req.params.type;
    request.ip = req.params.ip;
    orchestrationController.getMediaPage(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: getMediaPage");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/getEpisodes/:mediaId", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.mediaId = req.params.mediaId;
    orchestrationController.getEpisodes(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: getEpisodes");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});


router.post("/addMedia", [
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists(),
    check("status", "status is not defined").exists()
    ], middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            orchestrationController.addMedia(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                console.error("Orchestration.js error: addMedia");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
       
});

router.post("/removeMedia", [
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists()
    ], middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            orchestrationController.removeMedia(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                console.error("Orchestration.js error: removeMedia");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
       
});

router.post("/addReview", [
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists(),
    check("rating", "rating is not defined").exists(),
    check("text", "text is not defined").exists()
    ], middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            orchestrationController.addReview(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                console.error("Orchestration.js error: addReview");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
});

router.post("/deleteReview", [
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists()
    ], middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            orchestrationController.deleteReview(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                console.error("Orchestration.js error: deleteReview");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
});

router.post("/updateStatus", [
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists(),
    check("status", "status is not defined").exists()
    ], middleware, authenticateJWT, (req, res) => {
        //console.log(req)
        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            orchestrationController.updateStatus(req.body)
            .then(result => {
                //console.log(result)
                res.status(200).json({success: true, result: result});
            })
            .catch(error =>{
                console.error("Orchestration.js error: updateStatus");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
            })
        }
});


router.get("/search/:name", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.name = req.params.name;
    orchestrationController.search(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: search");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/searchMovies/:name", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.name = req.params.name;
    orchestrationController.searchMovies(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: search");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/searchSeries/:name", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.name = req.params.name;
    orchestrationController.searchSeries(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: search");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/popularSeries", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    orchestrationController.popularSeries(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: search");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

router.get("/popularMovies", middleware, authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    orchestrationController.popularMovies(request)
    .then(result => {
        //console.log(result)
        res.status(200).json({success: true, result: result});
    })
    .catch(error =>{
        console.error("Orchestration.js error: search");
        console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
    })
});

module.exports = router;