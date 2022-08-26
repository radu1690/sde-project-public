require('dotenv').config();
const axios = require('axios');
const { response } = require('express');
var _ = require('lodash');

//var IMDB_key = process.env.IMDB_KEY;
var TMDB_key = process.env.TMDB_KEY;
var GEONAMES_key = process.env.GEONAMES_KEY;
//var IMDB_key = "k_di52vmiy";
//var TMDB_key = "d8f2ce19600c82ecfb083996bb1c4452";


//var IMDB_endpoint = "https://imdb-api.com/en/API/";
var TMDB_endpoint = "https://api.themoviedb.org/3/";
var TMDB_image_base = "https://image.tmdb.org/t/p/w780";

var all_request = "multi/";
var movies_request = "movie/";
var series_request = "tv/";

function search(name){
    //console.log(name);
    let request = all_request;
    return genericRequest(name, request, true);
}

function searchMovies(name){
    let request = movies_request;
    return genericRequest(name, request, true);
}

function searchSeries(name){
    let request = series_request;
    return genericRequest(name, request, true);
}

//returns 20 popular movies
function mostPopularMovies(){
    let request = movies_request;
    return genericRequest(null, request, false);
}

//returns 20 popular series
function mostPopularTVs(){
    let request = series_request;
    return genericRequest(null, request, false);
}




async function genericRequest(name, request, isSearch){
    let query;
    if(isSearch){
        name = formatSearch(name);
        query = TMDB_endpoint + "search/" + request + "?api_key=" + TMDB_key + "&query=" + name;
    }else{
        query = TMDB_endpoint + request + "popular" + "?api_key=" + TMDB_key;
        // console.log(query)
    }
    //console.log(query);
    let response = await axios.get(query)
        .catch(error => {
            throwError(error);
        })

        
    let toReturn = {};
    //toReturn.expression = response.data.expression;
    toReturn.results = [];
    response.data.results.forEach(element => {
        //multi search returns movies, tv series, people. Need to filter out people
        if(request == movies_request || request == series_request || element.media_type == "movie" || element.media_type == "tv"){
            let entry = {};
            entry.id = element.id;

            //image path is made by base_url + poster_path
            if(element.poster_path!=null){
                entry.image = TMDB_image_base + element.poster_path;
            }else{
                entry.image = element.poster_path;
            }

            //the title is title for movies, name for tv series
            if(request == movies_request || element.media_type == "movie"){
                entry.title = element.title;
                entry.type = "movie";
                entry.date = element.release_date;
            }else if(request == series_request || element.media_type == "tv"){
                entry.title = element.name;
                entry.type = "tv";
                entry.date = element.first_air_date;
            }else{
                //if something went wrong
                let error;
                error.response = "Generic search error: type not a movie or serie: " + element.media_type;
                throwError(error);
            }

            entry.popularity = element.popularity;
            
            toReturn.results.push(entry);
            }
        });
    //console.log(response.data.results);
    toReturn.results.sort((a, b) => b.popularity - a.popularity);

    return toReturn.results;
}


function throwError(error){
    let err = {};
    err.code = 500;
    err.errmsg = "Adapter Service: Internal server error, check console for details";
    if(error.response.status == 404){
        err.code = 404;
        err.errmsg = "Not found";
    }
    console.error(error.response);
    throw(err);
}


async function getDetails(id, type){
    let query;
    if(type == "movie"){
        query = TMDB_endpoint+"movie/"+id+"?api_key=d8f2ce19600c82ecfb083996bb1c4452&language=en-US"
    }else{
        type = "tv";
        query = TMDB_endpoint+"tv/"+id+"?api_key=d8f2ce19600c82ecfb083996bb1c4452&language=en-US"
    }

    let response = await axios.get(query)
        .catch(error => throwError(error));

    let data = response.data;
    let toReturn = {};

    toReturn.id = data.id;
    
    toReturn.type = type;
    toReturn.popularity = data.popularity;
    toReturn.overview = data.overview;
    toReturn.genres = [];

    data.genres.forEach(genre => {
        toReturn.genres.push(genre);
    })

    if(type != 'movie'){
        toReturn.image = TMDB_image_base + data.poster_path;
        toReturn.title = data.name;
        toReturn.date = data.first_air_date;
        toReturn.number_of_episodes = data.number_of_episodes;
        toReturn.number_of_seasons = data.number_of_seasons;
    }else{
        toReturn.image = TMDB_image_base + data.poster_path;
        toReturn.date = data.release_date;
        toReturn.title = data.title;
    }

    return toReturn;
}

async function getSeasons(id, n_season){
    let query;
    query = TMDB_endpoint+"tv/"+id+"/season/"+n_season+"?api_key=d8f2ce19600c82ecfb083996bb1c4452&language=en-US";

    let response = await axios.get(query)
        .catch(error => throwError(error));

    let data = response.data;
    let toReturn = {};

    toReturn.id = data._id;
    toReturn.air_date = data.air_date;
    toReturn.episodes = [];

    data.episodes.forEach(episode => {
        let e = {};
        e.id = episode.id;
        e.episode_number = episode.episode_number;
        e.name = episode.name;
        e.overview = episode.overview;
        e.image = TMDB_image_base + episode.still_path;
        toReturn.episodes.push(e);
    })

    return toReturn;
}

async function countryCode(ip){
    let query = "https://api.country.is/"+ip;
    try{
        let response = await axios.get(query);
        return(response.data.country)
    }catch(e){
        return null;
    }
}

async function getProviders(id, type, countryCode){
    try{
        let query = TMDB_endpoint+type+"/"+id+"/watch/providers?api_key="+TMDB_key;
        //console.log(query)
        let response = await axios.get(query);
        // console.log(response.data)
        let result;
        if(response.data.results[countryCode] == null){
            //console.log("null")
            return []
        }else{
            result = response.data.results[countryCode]
        }
        let stream = result.flatrate;
        let buy = result.buy;
        let ads = result.ads;

        let tmp = [];
        processProviderArray(stream, tmp);
        processProviderArray(buy, tmp);
        processProviderArray(ads, tmp);
        let toReturn = _.union(tmp);
        return toReturn;
    }catch(e){
        console.log(e);
        return [];
    }
}

function processProviderArray(source, tmp){
    if(source != null){
        for(let i=0; i<source.length; i++){
            tmp.push(source[i].provider_name);
        }
    }
    return tmp;
}

async function getRecommendation(request){
    let genres = request.genres.split(',');
    //console.log(genres);
    if(genres.length == 0){
        let error = {};
        error.response = {};
        error.response.status = 404;
        throwError(error);
        return;
    }
    let n = genres.length;
    
    if(n>3){
        n = 3;
    }
    let genre_query = "";
    for(let i=0; i<n; i++){
        if(i!=0){
            genre_query = genre_query + ',';
        }
        genre_query = genre_query + genres[i];
    }
    //console.log(genre_query)
    let query1 = TMDB_endpoint+"discover/"+"movie"+"?api_key="+TMDB_key+"&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_genres="+genre_query+"&with_watch_monetization_types=flatrate";
    let query2 = TMDB_endpoint+"discover/"+"tv"+"?api_key="+TMDB_key+"&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_genres="+genre_query+"&with_watch_monetization_types=flatrate";
    let results = [];
    //console.log(query1)

    let r1 = axios.get(query1)
        .catch(error => {
            throwError(error);
        })
    let r2 = axios.get(query2)
        .catch(error => {
            throwError(error);
        })

    let result1 = await r1;
    //id image title type popularity
    result1.data.results.forEach(movie => {
        let m = {};
        m.id = movie.id;
        m.image = TMDB_image_base + movie.poster_path;
        m.title = movie.title;
        m.popularity = movie.popularity;
        m.genre_ids = movie.genre_ids;
        m.type = "movie";
        results.push(m);
    })


    let result2 = await r2;
    result2.data.results.forEach(tv => {
        let m = {};
        m.id = tv.id;
        m.image = TMDB_image_base +  tv.poster_path;
        m.title = tv.name;
        m.popularity = tv.popularity;
        m.genre_ids = tv.genre_ids;
        m.type = "tv";
        results.push(m);
    })

    
    //results.sort((a, b) => b.popularity - a.popularity);
    results = _.shuffle(results);

    return results;
    
}

async function getSimilar(id, type){
    if(type != "movie" && type!= "tv"){
        return null;
    }
    let query = TMDB_endpoint + type + "/"+ id +"/similar?api_key="+TMDB_key + "&language=en-US";
    let res = await axios.get(query);
    let results = [];
    res.data.results.forEach(media => {
        let entry = {};
        entry.id = media.id;
        entry.popularity = media.popularity;
        entry.image = TMDB_image_base + media.poster_path;
        entry.type = type;
        if(type == "movie"){
            entry.title = media.title;
            entry.date = media.release_date;
        }else{
            entry.title = media.name;
            entry.date = media.first_air_date;
        }
        results.push(entry);
    })
    results = _.shuffle(results);
    return results;
}


function formatSearch(request){
    return request.replace(/ /g,"%20");
}




module.exports.search = search;
module.exports.searchMovies = searchMovies;
module.exports.searchSeries = searchSeries;
module.exports.mostPopularMovies = mostPopularMovies;
module.exports.mostPopularTVs = mostPopularTVs;
module.exports.getDetails = getDetails;
module.exports.getSeasons = getSeasons;
module.exports.countryCode = countryCode;
module.exports.getProviders = getProviders;
module.exports.getRecommendation = getRecommendation;
module.exports.getSimilar = getSimilar;
