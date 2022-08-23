const express = require("express");
const router = express.Router({mergeParams: true});
const {check, validationResult} = require("express-validator/check");
var reviewController = require("../controllers/reviewController");
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
router.post("/addReview", [
    check("mediaId", "mediaId is not defined").exists(),
    check("userId", "mediaId is not defined").exists(),
    check("rating", "rating is not defined").exists(),
    check("text", "text is not defined").exists(),
    check("type", "type is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            reviewController.addReview(req.body).then(review => {
                res.status(201).json({success: true, result: review});
            }).catch(error =>{
                if (error.name === 'MongoServerError' && error.code === 11000) {
                    // Duplicate username
                    return res.status(409).send({ success: false, errors: [{"msg": 'Review already exists for this movie by this user'}]});
                }
                console.error("reviewRoutes.js error: addReview");
                console.error(error);
                if(error.code){
                    res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
                }else{
                    res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
                }
            })
        }
});


router.post("/updateReview", [
    check("mediaId", "mediaId is not defined").exists(),
    check("userId", "mediaId is not defined").exists(),
    check("rating", "rating is not defined").exists(),
    check("text", "text is not defined").exists(),
    check("type", "type is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            reviewController.updateReview(req.body).then(result => {
                if(result){
                    res.status(200).json({success: true, result: result});
                }else{
                    res.status(400).json({success: false, errors: [{"msg": "Review not found"}]})
                }
                
            }).catch(error =>{
                console.error("reviewRoutes.js error: updateReview");
                console.error(error);
                res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
            })
        }
});

router.post("/deleteReview", [
    check("mediaId", "mediaId is not defined").exists(),
    check("userId", "mediaId is not defined").exists(),
    check("type", "type is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            reviewController.deleteReview(req.body).then(result => {
                if(result){
                    res.status(200).json({success: true, result: result});
                }else{
                    res.status(404).json({success: false, errors: [{"msg": "Review not found"}]})
                }
                
            }).catch(error =>{
                console.error("reviewRoutes.js error: updateReview");
                console.error(error);
                res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
            })
        }
});

router.get("/getReview/:userId/:type/:mediaId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    request.mediaId = req.params.mediaId;
    request.type = req.params.type;
    reviewController.getReview(request).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "Review not found"}]})
        }
        
    }).catch(error =>{
        console.error("reviewRoutes.js error: getReview");
        console.error(error);
        res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.get("/getUserReviews/:userId", authenticateJWT, (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    reviewController.getUserReviews(request).then(result => {
        res.status(200).json({success: true, result: result});
        
    }).catch(error =>{
        console.error("reviewRoutes.js error: getReview");
        console.error(error);
        res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.get("/getReviews/:type/:mediaId", authenticateJWT, (req, res) => {
    let request = {};
    request.mediaId = req.params.mediaId;
    request.type = req.params.type;
    reviewController.getReviews(request).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "No review found"}]})
        }
        
    }).catch(error =>{
        console.error("reviewRoutes.js error: getReview");
        console.error(error);
        res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
    })
        
});

router.get("/getAverageRating/:type/:mediaId", authenticateJWT, (req, res) => {
    let request = {};
    request.mediaId = req.params.mediaId;
    request.type = req.params.type;
    reviewController.getAverageRating(request).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "No review found"}]})
        }
        
    }).catch(error =>{
        console.error("reviewRoutes.js error: getReview");
        console.error(error);
        res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
    })
        
});

module.exports = router;