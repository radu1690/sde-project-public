require('dotenv').config();
const axios = require('axios');
const ADAPTER_ENDPOINT = process.env.ADAPTER_ENDPOINT;
const DATA_ENDPOINT = process.env.DATA_ENDPOINT;
const BUSINESS_ENDPOINT = process.env.BUSINESS_ENDPOINT;
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
    //console.log(token)
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

async function register(request){
    //console.log(request)
    let response = await axios.post(AUTH_ENDPOINT + "register", request).catch(error => {
    if (error.response) {
       throwError(error.response.data.errors[0].msg, error.response.status)
      }
    })
    if(response.data.success){
        return response.data.result;
    }else{
        throwError("Registration error");
    }
}

async function login(request){
    //console.log(request)
    let response = await axios.post(AUTH_ENDPOINT + "login", request).catch(error => {
    if (error.response) {
       throwError(error.response.data.errors[0].msg, error.response.status)
      }
    })
    if(response.data.success){
        return response.data.result;
    }else{
        throwError("Login error");
    }
}

async function logout(request){
    //console.log(request)
    let response = await axios.post(AUTH_ENDPOINT + "logout", request).catch(error => {
        if (error.response) {
           throwError(error.response.data.errors[0].msg, error.response.status)
          }
        })
        if(response.data.success){
            return response.data.result;
        }else{
            throwError("Logout error");
        }
}

async function refreshToken(request){
    //console.log(request)
    let response = await axios.post(AUTH_ENDPOINT + "refreshToken", request).catch(error => {
    if (error.response) {
       throwError(error.response.data.errors[0].msg, error.response.status)
    }
    else{
        throwError("Auth service unavailable", 500);
    }
    
    })
    if(response.data.success){
        return response.data.result;
    }else{
        throwError("Refresh Token error");
    }
}

async function getUserPage(request){
    let userExists = await axios.get(DATA_ENDPOINT+"userExists/"+request.userId)
        .catch(err => throwError("Data service unavailable"));
    if(userExists.data.success == false || userExists.data.result == false){
        throwError("User not found", 404);
    }
    let response = await axios.get(BUSINESS_ENDPOINT+"getUserPage/"+request.userId).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("BUSINESS service unavailable")
        }
        if (error.response) {
           throwError(error.response.data.errors[0].msg, error.response.status)
          }
        });
    return response.data.result;

}

async function getPageByUsername(request){
    let user = await axios.get(`${AUTH_ENDPOINT}getUser/${request.username}`).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("AUTH service unavailable")
        }
        if (error.response) {
           throwError(error.response.data.errors[0].msg, error.response.status)
          }
        });
    let r = {};
    r.userId = user.data.result._id;
    // console.log(r);
    return getUserPage(r);
}

async function getMediaPage(request){
    let userExists = await axios.get(DATA_ENDPOINT+"userExists/"+request.userId)
        .catch(err => throwError("Data service unavailable"));
    if(userExists.data.success == false || userExists.data.result == false){
        throwError("Server Error: authenticated user does not exist", 500);
    }
    //console.log(`${BUSINESS_ENDPOINT}/getMediaPage/${request.userId}/${request.type}/${request.mediaId}/${request.ip}`)
    let response = await axios.get(`${BUSINESS_ENDPOINT}/getMediaPage/${request.userId}/${request.type}/${request.mediaId}/${request.ip}`).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("BUSINESS service unavailable")
        }
        if (error.response) {
        throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}

async function getEpisodes(request){
    let response = await axios.get(`${BUSINESS_ENDPOINT}/getEpisodes/${request.mediaId}`).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("BUSINESS service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}

async function addMedia(request){
    let response = await axios.post(`${BUSINESS_ENDPOINT}/addMedia`, request).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("BUSINESS service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}

async function removeMedia(request){
    //console.log(request)
    let response = await axios.post(`${DATA_ENDPOINT}/removeMedia`, request).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("DATA service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}

async function addReview(request){
    if(request.rating < 1 || request.rating > 10){
        throwError("Rating must be between 1-10", 400);
    }
    if(request.type!= "movie" && request.type!= "tv"){
        throwError("Type must be either movie or tv", 400);
    }
    let mediaDetails = await axios.get(`${ADAPTER_ENDPOINT}/getDetails/${request.type}/${request.mediaId}`)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
    })
    request.mediaName = mediaDetails.data.result.title;
    let response = await axios.post(`${DATA_ENDPOINT}/addReview`, request).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("DATA service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}

async function deleteReview(request){
    if(request.type!= "movie" && request.type!= "tv"){
        throwError("Type must be either movie or tv", 400);
    }
    let response = await axios.post(`${DATA_ENDPOINT}/deleteReview`, request).catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("DATA service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        });
    return response.data.result;
}


async function updateStatus(request){
    if(request.type != "movie" && request.type !="tv"){
        throwError("Media must be movie/tv", 400)
    }
    if(!checkStatus(request.status)){
        throwError("Invalid status", 400);
    }
    let res = await axios.post(DATA_ENDPOINT + "updateStatus", request)
        .catch(error => {
            if(error.code == "ECONNREFUSED"){
                throwError("DATA service unavailable")
            }
            if (error.response) {
                throwError(error.response.data.errors[0].msg, error.response.status)
            }
            throwError("BUSINESS: updateStatus error");
        })
    return res.data;
}

async function search(request){
    let query = `${ADAPTER_ENDPOINT}/search/${request.name}`;
    let res = await axios.get(query)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        throwError("BUSINESS: search error");
    })
    //console.log(res)
    return res.data.results;
}

async function searchMovies(request){
    let query = `${ADAPTER_ENDPOINT}/searchMovies/${request.name}`;
    let res = await axios.get(query)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        throwError("BUSINESS: search error");
    })
    //console.log(res)
    return res.data.results;
}

async function searchSeries(request){
    let query = `${ADAPTER_ENDPOINT}/searchSeries/${request.name}`
    let res = await axios.get(query)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        throwError("BUSINESS: search error");
    })
    //console.log(res)
    return res.data.results;
}

async function popularMovies(request){
    let query = `${ADAPTER_ENDPOINT}/mostPopularMovies`
    let res = await axios.get(query)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        throwError("BUSINESS: search error");
    })
    //console.log(res)
    return res.data.results;
}

async function popularSeries(request){
    let query = `${ADAPTER_ENDPOINT}/mostPopularSeries`
    let res = await axios.get(query)
    .catch(error => {
        if(error.code == "ECONNREFUSED"){
            throwError("ADAPTER service unavailable")
        }
        if (error.response) {
            throwError(error.response.data.errors[0].msg, error.response.status)
        }
        throwError("BUSINESS: search error");
    })
    //console.log(res)
    return res.data.results;
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



module.exports.register = register;
module.exports.login = login;
module.exports.logout = logout;
module.exports.refreshToken = refreshToken;
module.exports.getUserPage = getUserPage;
module.exports.getMediaPage = getMediaPage;
module.exports.getEpisodes = getEpisodes;
module.exports.addMedia = addMedia;
module.exports.removeMedia = removeMedia;
module.exports.addReview = addReview;
module.exports.deleteReview = deleteReview;
module.exports.updateStatus = updateStatus;
module.exports.search = search;
module.exports.searchMovies = searchMovies;
module.exports.searchSeries = searchSeries;
module.exports.popularMovies = popularMovies;
module.exports.popularSeries = popularSeries;
module.exports.getPageByUsername = getPageByUsername;
