const express = require("express");
const router = express.Router({mergeParams: true});
const {check, validationResult} = require("express-validator/check");
var userController = require("../controllers/userController");
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
        //console.log("DENIED");
        res.status(401).json({ succes: false, errors: [{"msg": 'ACCESS DENIED'}]})
    }
}
//create a user in the database
//422 => missing params
//409 => user already exists
//500 => general server error
//201 => success, user created
router.post("/register", [
    check("username", "username is not defined").exists(),
    check("password", "password is not defined").exists(),
    check("ip", "ip is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            userController.createUser(req.body).then(token => {
                res.status(201).json({success: true, result: token});
            }).catch(error =>{
                if (error.name === 'MongoServerError' && error.code === 11000) {
                    // Duplicate username
                    return res.status(409).send({ success: false, errors: [{"msg": 'User already exists!'}]});
                }
                console.error("userRoutes.js error: createUser");
                console.error(error);
                res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
            })
        }
});

//gets an auth token for the user
//422 => missing params
//403 => wrong username/password
//500 => general server error
//200 => success, sending token
router.post("/login", [
    check("username", "username is not defined").exists(),
    check("password", "password is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            userController.loginUser(req.body).then(token => {
                res.status(200).json({success: true, result: token});
            }).catch(error =>{
                console.error("userRoutes.js error: loginUser");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
            });
        }
});

router.post("/logout", [
    check("userId", "userId is not defined").exists()
    ], authenticateJWT, (req, res) => {
        //console.log(req.body)
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            //console.log(req.body)
            userController.logoutUser(req.body).then(result => {
                res.status(200).json({success: result});
                
            }).catch(error =>{
                console.error("userRoutes.js error: loginUser");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
            });
        }
});


//deletes a
//422 => missing params
//403 => wrong username/password
//500 => general server error
//200 => success
router.delete("/remove", [
    check("username", "username is not defined").exists(),
    check("password", "password is not defined").exists()
    ], authenticateJWT, (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({success: false, errors: errors.array()});
        }else{
            userController.deleteUser(req.body).then(comment => {
                res.status(200).json({success: true, comment: comment});
            }).catch(error =>{
                console.error("userRoutes.js error: deleteUser");
                console.error(error);
                res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
            });
        }
});

router.get("/getUserName/:userId", (req, res) => {
    let request = {};
    request.userId = req.params.userId;
    userController.getUserName(request).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "No user found"}]})
        }
        
    }).catch(error =>{
        console.error("userRoutes.js error: getUserName");
        //console.error(error);
        if(error.code){
            console.log(error)
            res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
        }else{
            res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
        }
        
    })
    
});

router.get("/getUser/:username", (req, res) => {
    let request = {};
    request.username = req.params.username;
    userController.getUserByUsername(request).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "No user found"}]})
        }
        
    }).catch(error =>{
        console.error("userRoutes.js error: getUser");
        console.error(error);
        if(error.code){
            console.log(error)
            res.status(error.code).json({success: false, errors: [{"msg": error.msg}]})
        }else{
            res.status(500).json({success: false, errors: [{"msg": error.errmsg}]})
        }
        
    })
    
});

router.post("/refreshToken", [
    check("token", "token is not defined").exists(),
    check("ip", "ip is not defined").exists()
    ], authenticateJWT, (req, res) => {
    userController.refreshToken(req.body).then(result => {
        if(result){
            res.status(200).json({success: true, result: result});
        }else{
            res.status(404).json({success: false, errors: [{"msg": "Fail"}]})
        }
        
    }).catch(error =>{
        if(error.code == 403){
            console.error(error);
            res.status(403).json({success: false, errors: [{"msg": error.msg}]});
        }else{
            console.error("userRoutes.js error: refreshToken");
            console.error(error);
            res.status(500).json({success: false, errors: [{"msg": error.errmsg}]});
        }
        
    })
    
});

module.exports = router;