require('dotenv').config();
var Review = require("../models/reviewModel");
var User = require("../models/userModel");

async function addReview(request){
    const filter = {
        mediaId: request.mediaId,
        userId: request.userId,
        type: request.type
    };
    let review = await Review.findOne(filter);
    if(review != null){
        const update = {
            rating: request.rating,
            text: request.text
        };
        let res = await Review.findOneAndUpdate(filter, update, {new: true});
        //console.log(res)
        return res;
    }else{
        let user = await User.findById(request.userId);
        if(user == null){
            throwError("User not found", 400);
        }
        let res = await Review.create({
            mediaId: request.mediaId,
            userId: request.userId,
            rating: request.rating,
            text: request.text,
            type: request.type,
            username: user.username,
            mediaName: request.mediaName
        })
        //console.log(res);
        return res;
    }
}

async function updateReview(request){
    const filter = {
        mediaId: request.mediaId,
        userId: request.userId,
        type: request.type
    };
    const update = {
        rating: request.rating,
        text: request.text
    };
    let res = await Review.findOneAndUpdate(filter, update);
    //console.log(res)
    if(res == null){
        return false;
    }
    return res;
}

async function deleteReview(request){
    let result = await Review.findOneAndRemove({userId: request.userId, mediaId: request.mediaId, type: request.type});
    //console.log(result);
    return result;
}

async function getReview(request){
    let result = await Review.findOne({userId: request.userId, mediaId: request.mediaId, type: request.type});
    //console.log(result);
    return result;
}

async function getUserReviews(request){
    let result = await Review.find({userId: request.userId});
    //console.log(result);
    return result;
}

async function getReviews(request){
    let results = await Review.find({mediaId: request.mediaId, type: request.type});
    //console.log(results);
    return results;
}

async function getAverageRating(request){
    let result = await Review.aggregate()
        .match({mediaId: request.mediaId, type: request.type})
        .group({_id: null, average: {"$avg": "$rating"}});

    //console.log(result);
    if(result.length == 0){
        return null;
    }
    return result[0].average;
}


function throwError(msg, code){
    let err = {};
    err.code = code;
    if(code == null){
        err.code = 500;
    }
    err.msg = msg;
    throw(err);
}

module.exports.addReview = addReview;
module.exports.updateReview = updateReview;
module.exports.deleteReview = deleteReview;
module.exports.getReview = getReview;
module.exports.getReviews = getReviews;
module.exports.getAverageRating = getAverageRating;
module.exports.getUserReviews = getUserReviews;
