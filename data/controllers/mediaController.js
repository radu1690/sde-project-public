require('dotenv').config();
var Media = require("../models/mediaModel");
var _ = require('lodash');
var User = require("../models/userModel");

async function addMedia(request){
    let res = await Media.create({
        mediaId: request.mediaId,
        userId: request.userId,
        genres: request.genres,
        title: request.title,
        image: request.image,
        status: request.status,
        type: request.type
    });
    //console.log(res);
    return res;
}

async function updateStatus(request){
    const filter = {
        mediaId: request.mediaId,
        userId: request.userId,
        type: request.type
    };
    const update = {
        status: request.status
    };
    let res = await Media.findOneAndUpdate(filter, update);
    //console.log(res)
    if(res == null){
        return false;
    }
    res.status = request.status;
    return res;
}

async function getSummary(request){
    let userId = request.userId;
    let queryWatched = Media.where({userId: userId, status: Statuses.WATCHED});
    let queryCompleted = Media.where({userId: userId, status: Statuses.COMPLETED});
    let queryWatching = Media.where({userId: userId, status: Statuses.WATCHING});
    let queryDroped = Media.where({userId: userId, status: Statuses.DROPED});
    let queryNotWatched = Media.where({userId: userId, status: Statuses.NOT_WATCHED})
    const result = await Promise.all([queryWatched.countDocuments(), queryCompleted.countDocuments(), queryWatching.countDocuments(), queryDroped.countDocuments(), queryNotWatched.countDocuments()]);

    let toReturn = {};
    toReturn[Statuses.WATCHED] = result[0];
    toReturn[Statuses.COMPLETED] = result[1];
    toReturn[Statuses.WATCHING] = result[2];
    toReturn[Statuses.DROPED] = result[3];
    toReturn[Statuses.NOT_WATCHED] = result[4];
    //  console.log(result);
    return toReturn;
}

async function removeMedia(request){
    let result = await Media.findOneAndRemove({userId: request.userId, mediaId: request.mediaId, type: request.type});
    //console.log(result);
    return result;
}

async function getMediaByUser(request){
    let results = await Media.find({userId: request.userId});
    // console.log(results);
    return results;
}


async function isMediaInList(request){
    let result = await Media.findOne({userId: request.userId, mediaId: request.mediaId, type: request.type});
    if(result){
        return true;
    }else{
        return false;
    }
}

async function getUserGenres(request){
    let medias = await Media.find({userId: request.userId});
    
    let arr = [];
    medias.forEach(media => {
        let g = media.genres;
        arr = arr.concat(g);
    })
    //find the counts using reduce
    var cnts = arr.reduce( function (obj, val) {
        obj[val] = (obj[val] || 0) + 1;
        return obj;
    }, {} );
    //Use the keys of the object to get all the values of the array
    //fd sort those keys by their counts
    var sorted = Object.keys(cnts).sort( function(a,b) {
        return cnts[b] - cnts[a];
    });
    //console.log(sorted);
    return sorted;
}

async function userExists(request){
    try{
        let res = await User.findById(request.userId);
        if(res != null){
            return true;
        }else{
            return false;
        }
    }catch(error){
        return false;
    }

}


// module.exports.createUser = createUser;
// module.exports.loginUser = loginUser;
// module.exports.deleteUser = deleteUser;

module.exports.addMedia = addMedia;
module.exports.updateStatus = updateStatus;
module.exports.getSummary = getSummary;
module.exports.removeMedia = removeMedia;
module.exports.getMediaByUser = getMediaByUser;
module.exports.isMediaInList = isMediaInList;
module.exports.getUserGenres = getUserGenres;
module.exports.userExists = userExists;


function throwError(error, code){
    let err = {};
    
    err.code = 500;
    err.errmsg = "Adapter Service: Internal server error, check console for details";
    if(error.response != null && error.response.status!= null && error.response.status == 404){
        err.code = 404;
        err.errmsg = "Not found";
    }
    console.error(error);
    throw(err);
}


const Statuses = {
    WATCHED: "watched",
    COMPLETED: "completed",
    WATCHING: "watching",
    DROPED: "droped",
    NOT_WATCHED: "not_watched"
}
Object.freeze(Statuses);
