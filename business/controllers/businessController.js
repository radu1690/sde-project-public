require('dotenv').config();
const axios = require('axios');
const ADAPTER_ENDPOINT = process.env.ADAPTER_ENDPOINT;
const DATA_ENDPOINT = process.env.DATA_ENDPOINT;
const AUTH_ENDPOINT = process.env.AUTH_ENDPOINT;
const fs = require('fs-extra');
const jwt = require("jsonwebtoken");
var genres = {};

const Statuses = {
    WATCHED: "watched",
    COMPLETED: "completed",
    WATCHING: "watching",
    DROPED: "droped",
    NOT_WATCHED: "not_watched"
}


axios.interceptors.request.use(config => {
    let token = jwt.sign({}, process.env.JWT_KEY, {
        expiresIn: "30s"
    });
    //console.log(token);
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });



async function init(){
    //console.log("Genres parsed")
    const g = await fs.readJson("./controllers/genres.json");
    for(let i=0; i<g.length; i++){
        genres[g[i].id] = g[i].name;
    }
}
//init();

async function getMediaPage(request){
    //console.log(request.ip)
    let userId = request.userId;
    let mediaId = request.mediaId;
    let type = request.type;
    let ip = request.ip;
    let mediaResult;
    try{
        mediaResult = await axios.get(ADAPTER_ENDPOINT + "getDetails/"+type+"/"+mediaId);
    }catch(error){
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if(error.response){
            throwError(error.response.data.errors[0].msg, error.response.status);
        }
        throwError("ADPTER ERROR: getDetails")
    }
    
    let ratingQuery = axios.get(DATA_ENDPOINT + "getAverageRating/"+type+"/"+mediaId, {validateStatus: false});
    let reviewsQuery = axios.get(DATA_ENDPOINT + "getReviews/"+type+"/"+mediaId);
    let countryCodeQuery = axios.get(ADAPTER_ENDPOINT + "countryCode/"+ ip, {validateStatus: false});
    let similarQuery = axios.get(ADAPTER_ENDPOINT + "getSimilar/"+type+"/"+mediaId);
    let checkListQuery = axios.get(DATA_ENDPOINT + "isMediaInList/"+userId+"/"+type+"/"+mediaId);
    let userReviewQuery = axios.get(DATA_ENDPOINT + "getReview/"+ userId+"/"+type+"/"+mediaId, {validateStatus: false});

    let [ratingResult, reviewsResult, countryCodeResult, similarResult, checkListResult, userReviewResult] = await Promise.all([
         ratingQuery, reviewsQuery, countryCodeQuery, similarQuery, checkListQuery, userReviewQuery
    ]).catch(error => {
        console.log(error);
        throwError("ADAPTER / DATA error");
    });

    let toReturn = {};
    toReturn.inList = (checkListResult.data.result == true);
    if(userReviewResult.data.success == true){
        toReturn.userReview = userReviewResult.data.result;
    }else{
        toReturn.userReview = null;
    }
    toReturn.details = mediaResult.data.result;
    if(ratingResult.data.success == true){
        
        toReturn.averageRating = ratingResult.data.result;
    }else{
        toReturn.averageRating = null;
    }
    toReturn.reviews = reviewsResult.data.result;
    toReturn.similar = similarResult.data.results;
    
    let countryCode = "US";
    toReturn.providers = [];
    //console.log(ip)
    //console.log(countryCodeResult.data);
    if(countryCodeResult.data.success == true){
        countryCode = countryCodeResult.data.result;
    }
    let providersQuery = await axios.get(ADAPTER_ENDPOINT + "getProviders/"+type+"/"+mediaId+"/"+countryCode);
    //console.log(ADAPTER_ENDPOINT + "countryCode/"+ ip)
    //console.log(providersQuery.data);
    if(providersQuery.data.success == true){
        toReturn.providers = providersQuery.data.result;
    }

    return toReturn;
}

async function getUserPage(request){
    let summaryQuery = axios.get(DATA_ENDPOINT + "getSummary/" + request.userId);
    let genresQuery = axios.get(DATA_ENDPOINT + "getUserGenres/" + request.userId);
    let listQuery = axios.get(DATA_ENDPOINT + "getMediaByUser/" + request.userId);
    let userNameQuery = axios.get(AUTH_ENDPOINT+"getUserName/"+request.userId);
    let reviewsQuery = axios.get(DATA_ENDPOINT+"getUserReviews/"+request.userId);
    let [genresResult, summaryResult, listResult, userNameResult, reviewsResult] = await Promise.all([
        genresQuery, summaryQuery, listQuery, userNameQuery, reviewsQuery
    ]).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("DATA/AUTH service unavailable")
        }
        if (error.response) {
            console.log(error.response)
           throwError(error.response.data.errors[0].msg, error.response.status)
          }
    });
    genresResult = genresResult.data;
    summaryResult = summaryResult.data;
    listResult = listResult.data;
    
    let toReturn = {};
    toReturn.userName = userNameResult.data.result.username;
    toReturn.summary = summaryResult.result;
    toReturn.medias = listResult.results;
    toReturn.reviews = reviewsResult.data.result;

    let genresInput = "";
    if(genresResult.result.length > 0){
        for(let i=0; i<genresResult.result.length; i++){
            if(i>2){
                break;
            }
            if(i!= 0){
                genresInput = genresInput + ',';
            }
            genresInput = genresInput + genresResult.result[i];
        }
        genresResult = await axios.get(ADAPTER_ENDPOINT + "recommended/"+genresInput).catch(e => throwError(Errors.ADAPTER));
        toReturn.recommended = genresResult.data.results;
    }else{
        toReturn.recommended = [];
    }

    return toReturn;
}


async function getEpisodes(request){
    let mediaId = request.mediaId;
    let detailsQuery = await axios.get(ADAPTER_ENDPOINT + "getDetails/tv/" + mediaId)
        .catch(error => {
            if(error.code == "ECONNREFUSED"){
                throwError("ADAPTER service unavailable")
            }
            if(error.response){
                throwError(error.response.data.errors[0].msg, error.response.status);
            }
            throwError("ADPTER ERROR: getDetails")
        });
    //console.log(detailsQuery);
    let nSeasons = detailsQuery.data.result.number_of_seasons;
    let nQueries = Array(nSeasons);
    for(let i=0; i<nSeasons; i++){
        let j = i + 1;
        nQueries[i] = axios.get(ADAPTER_ENDPOINT + "getSeasons/"+mediaId+"/"+j);
    }
    let nResults = Array(nSeasons);
    for(let i=0; i<nSeasons; i++){
        nResults[i] = await nQueries[i];
    }
    
    
    let toReturn = [];
    for(let i=0; i<nSeasons; i++){
        nResults[i].data.result.episodes.forEach(ep => {
            ep.season_number = i+1;
            toReturn.push(ep);
        })
    }
    return toReturn;
}

async function addMedia(request){
    let mediaId = request.mediaId;
    let type = request.type;
    if(type != "movie" && type !="tv"){
        throwError("Media must be movie/tv", 400)
    }
    let details = await axios.get(ADAPTER_ENDPOINT+"getDetails/"+type+"/"+mediaId)
        .catch(error => {
            if(error.code == "ECONNREFUSED"){
                throwError("ADAPTER service unavailable")
            }
            console.log(error)
            if(error.response){
                throwError(error.response.data.errors[0].msg, error.response.status);
            }else{
                throwError("ADPTER ERROR: getDetails")
            }
        });
    //console.log(details)
    details = details.data.result;
    let media = {};
    media.mediaId = request.mediaId;
    media.userId = request.userId;
    media.genres = [];
    details.genres.forEach(g => {
        let genre = g.id;
        media.genres.push(genre);
    });
    media.title = details.title;
    media.image = details.image;
    media.type = details.type;
    media.status = Statuses.NOT_WATCHED;
    if(checkStatus(request.status)){
        media.status = request.status;
    }

    let res = await axios.post(DATA_ENDPOINT+"addMedia", media).catch(error => {
        if (error.response) {
            // console.log(error.response.data);
            // console.log(error.response.status);
            // console.log(error.response.headers);
            throwError(error.response.data.errors[0].msg, error.response.status)
          }
        if(error.code == "ECONNREFUSED"){
            throwError("DATA service unavailable")
        }
    });
    //console.log(res)
    return res.data.result;
}

async function updateStatus(request){
    if(request.type != "movie" && request.type !="tv"){
        throwError("Media must be movie/tv", 400)
    }
    if(!checkStatus(request.status)){
        throwError("Invalid status", 400);
    }
    let req = {};
    req.mediaId = request.mediaId;
    req.userId = request.userId;
    req.status = request.status;
    req.type = request.type;
    query = await axios.get(DATA_ENDPOINT + "updateStatus", req)
        .catch(error => {
            if(error.code == "ECONNREFUSED"){
                throwError("DATA service unavailable")
            }
            throwError("BUSINESS: updateStatus error");
        })
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

const Errors = {
    DATA: "data service error",
    ADAPTER: "adapter service error"
}

function checkStatus(status){
    return Object.values(Statuses).includes(status);
}




module.exports.getUserPage = getUserPage;
module.exports.getMediaPage = getMediaPage;
module.exports.getEpisodes = getEpisodes;
module.exports.addMedia = addMedia;
