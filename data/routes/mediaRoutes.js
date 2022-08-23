const express = require("express");
const router = express.Router({mergeParams: true});
const {check, validationResult} = require("express-validator/check");
var mediaController = require("../controllers/mediaController");
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


//adds a movie/tv to a list
//422 => missing params
//409 => movie alreadt exists in a list
//500 => general server error
//201 => success, movie added
router.post("/addMedia", [
    check("mediaId", "mediaId is not defined").exists(),
    check("userId", "mediaId is not defined").exists(),
    check("genres", "genres is not defined").exists(),
    check("title", "title is not defined").exists(),
    check("image", "image is not defined").exists(),
    check("status", "status is not defined").exists(),
    check("type", "type is not defined").exists(),
    ], authenticateJWT, (req, res) => {

        const errors = validationResult(req);
        //console.log(req.body)
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            mediaController.addMedia(req.body).then(entry => {
                res.status(201).json({succes: true, result: entry});
            }).catch(error =>{
                if (error.name === 'MongoServerError' && error.code === 11000) {
                    // Duplicate username
                    return res.status(409).send({ succes: false, errors: [{"msg": 'Movie/tv already in the list'}]});
                }
                console.error("movieRoutes.js error: addMedia");
                console.error(error);
                res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
            })
        }
});


router.post("/updateStatus", [
    check("mediaId", "mediaId is not defined").exists(),
    check("userId", "mediaId is not defined").exists(),
    check("status", "status is not defined").exists(),
    check("type", "type is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            mediaController.updateStatus(req.body).then(result => {
                if(result){
                    res.status(200).json({succes: true, result: result});
                }else{
                    res.status(400).json({success: false, errors: [{"msg": 'Move/tv is not in users list'}]})
                }
                
            }).catch(error =>{
                console.error("movieRoutes.js error: updateStatus");
                console.error(error);
                res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
            })
        }
});


router.get("/getSummary/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    mediaController.getSummary(request).then(result => {
        res.status(200).json({succes: true, result: result});
    }).catch(error =>{
        console.error("mediaRoutes.js error: getSummary");
        console.error(error);
        res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.post("/removeMedia", [
    check("userId", "userId is not defined").exists(),
    check("mediaId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists()
    ], authenticateJWT, (req, res) => {
        //console.log(req.body);
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            mediaController.removeMedia(req.body).then(result => {
                if(result){
                    res.status(200).json({succes: true, result: result});
                }else{
                    res.status(404).json({succes: false, errors: [{"msg": "Media not found"}]});
                }
                
            }).catch(error =>{
                console.error("mediaRoutes.js error: removeMedia");
                console.error(error);
                res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
            })
        }
});


router.get("/getMediaByUser/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    mediaController.getMediaByUser(request).then(result => {
        res.status(200).json({succes: true, results: result});
    }).catch(error =>{
        console.error("mediaRoutes.js error: getMedia");
        console.error(error);
        res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.get("/isMediaInList/:userId/:type/:mediaId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.type = req.params.type;
    request.mediaId = req.params.mediaId;
    mediaController.isMediaInList(request).then(result => {
        res.status(200).json({succes: true, result: result});
    }).catch(error =>{
        console.error("mediaRoutes.js error: isMediaInList");
        console.error(error);
        res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
    })
        
});

//return an array with media genres sorted by their occurences in the user list
router.get("/getUserGenres/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    mediaController.getUserGenres(request).then(result => {
        res.status(200).json({succes: true, result: result});
    }).catch(error =>{
        console.error("mediaRoutes.js error: getUserGenres");
        console.error(error);
        res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.get("/userExists/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    mediaController.userExists(request).then(result => {
        //console.log("routes: "+result);
        res.status(200).json({succes: true, result: result});
    }).catch(error =>{
        console.error("mediaRoutes.js error: getUserGenres");
        console.error(error);
        res.status(500).json({succes: false, errors: [{"msg": error.errmsg}]})
    })
        
});


module.exports = router;