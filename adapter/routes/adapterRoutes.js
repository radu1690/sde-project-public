const express = require("express");
const router = express.Router({mergeParams: true});
var adapterController = require("../controllers/adapterController");
const {check, validationResult} = require("express-validator/check");

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

router.get("/search/:name", authenticateJWT, (req, res) => {
    let name = req.params.name;
    adapterController.search(name)
        .then(result => res.status(200).json({success: true, results: result}))
        .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/searchMovies/:name", authenticateJWT, (req, res) => {
    let name = req.params.name;
    adapterController.searchMovies(name)
    .then(result => res.status(200).json({success: true, results: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/searchSeries/:name", authenticateJWT, (req, res) => {
    let name = req.params.name;
    adapterController.searchSeries(name)
    .then(result => res.status(200).json({success: true, results: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/mostPopularMovies", authenticateJWT, (req, res) => {
    adapterController.mostPopularMovies()
    .then(result => res.status(200).json({success: true, results: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/mostPopularSeries", authenticateJWT, (req, res) => {
    adapterController.mostPopularTVs()
    .then(result => res.status(200).json({success: true, results: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});


router.get("/getDetails/:type/:id", authenticateJWT, (req, res) => {
    let type = req.params.type;
    let id = req.params.id;
    adapterController.getDetails(id, type)
    .then(result => res.status(200).json({success: true, result: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/getSeasons/:id/:number", authenticateJWT, (req, res) => {
    let number = req.params.number;
    let id = req.params.id;
    adapterController.getSeasons(id, number)
    .then(result => res.status(200).json({success: true, result: result}))
    .catch(error => res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]}));
});

router.get("/countryCode/:ip", authenticateJWT, (req, res) => {
    let ip = req.params.ip;
    adapterController.countryCode(ip)
        .then(result => {
            if(result == null){
                res.status(404).json({success: false, result: result});
            }else{
                res.status(200).json({success: true, result: result})
            }
        })
        .catch(error => {
            console.log(error);
            return res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
        });
});

router.get("/getProviders/:type/:id/:countryCode", authenticateJWT, (req, res) => {
    let type = req.params.type;
    let id = req.params.id;
    let countryCode = req.params.countryCode;
    adapterController.getProviders(id, type, countryCode)
        .then(result => {
            if(result == null){
                res.status(404).json({success: false, result: result});
            }else{
                res.status(200).json({success: true, result: result})
            }
        })
        .catch(error => {
            console.log(error);
            return res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
        });
});

router.get("/recommended/:genres", authenticateJWT, (req, res) => {
        
    let request = {};
    request.genres = req.params.genres;
    adapterController.getRecommendation(request).then(response => {
        res.status(200).json({success: true, results: response});
    }).catch(error =>{
        //console.error("Adapter error: recommended");
        //console.error(error);
        res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
    });
        
});

router.get("/getSimilar/:type/:id", authenticateJWT, (req, res) => {
    let type = req.params.type;
    let id = req.params.id;
    adapterController.getSimilar(id, type)
        .then(result => {
            if(result == null){
                res.status(404).json({success: false, results: result});
            }else{
                res.status(200).json({success: true, results: result})
            }
        })
        .catch(error => {
            console.log(error);
            return res.status(error.code).json({success: false, errors: [{"msg": error.errmsg}]});
        });
});


module.exports = router;
