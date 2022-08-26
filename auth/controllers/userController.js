require('dotenv').config();
var User = require("../models/userModel");
var crypto = require('crypto');
var jwt = require("jsonwebtoken");

var jwt_auth = process.env.JWT_AUTH;
var jwt_refresh = process.env.JWT_REFRESH;
var auth_expiration = "1d";
var refresh_expiration = "30d";

//Creates a user in the database
async function createUser(data){
    let password = getHashedPassword(data.password);
    let user =  await User.create({
        username: data.username,
        password: password,
        last_location: data.ip
    });
    //console.log(new Date().getTime()/1000);
    let response = {};
    response.accessToken = generateToken(user, jwt_auth, auth_expiration);
    response.refreshToken = generateToken(user, jwt_refresh, refresh_expiration); 
    return response;

}

//Authenticates the user by checking username and password. 
//If the user is found it returns a jwt token with the username and the id (_id)
async function loginUser(data){
    return new Promise(function(resolve, reject){
        let password = getHashedPassword(data.password);
        User.findOne({username: data.username, password: password}, function(err, user){
            if(err){
                let error = {};
                error.code = 500;
                error.errmsg = "Internal error";
                reject(error);
            }else{
                if(user!=null){
                    User.findOneAndUpdate({username: data.username}, {last_location: data.ip}, {new: true}, function(err, user){
                        let response = {};
                        response.accessToken = generateToken(user, jwt_auth, auth_expiration);
                        response.refreshToken = generateToken(user, jwt_refresh, refresh_expiration); 
                        resolve(response);
                    })
                }else{
                    let error = {};
                    error.code = 403;
                    error.errmsg = "Wrong username or password";
                    reject(error);
                }
            }
        });
    });
}

async function logoutUser(request){
    const filter = {
        _id: request.userId
    };
    //console.log(filter)
    const update = {
        last_location : null
    };
    let res = await User.findOneAndUpdate(filter, update, {new: true});
    //console.log(res)
    if(res != null){
        return true;
    }else{
        return false;
    }
}


//Deletes the user after checking username and password. 
//If the user is found it returns confirmation of delete, otherwise an error
function deleteUser(data){
    return new Promise(function(resolve, reject){
        let password = getHashedPassword(data.password);
        User.findOneAndRemove({username: data.username, password: password}, function(err, user){
            if(err){
                let error = {};
                error.code = 500;
                error.errmsg = "Internal error";
                reject(error);
            }else{
                if(user!=null){
                    resolve("User deleted");
                }else{
                    let error = {};
                    error.code = 403;
                    error.errmsg = "Wrong username or password";
                    reject(error);
                }
            }
        });
    });
}

async function refreshToken(request){
    var decoded;
    try{
        decoded = jwt.verify(request.token, jwt_refresh);
        //console.log(decoded)
    }catch(error){
        console.log(error)
        throwError("Refresh token not valid", 403);
    }
    //console.log(decoded);
    let user = await User.findById(decoded._id);
    //console.log(user)
    if(user != null && user.last_location == request.ip){
        let response = {};
        response.accessToken  = generateToken(user, jwt_auth, auth_expiration);
        //if refresh token expires in less than 5 days, generate a new one
        let now = new Date().getTime()/1000;
        if(decoded.exp - now < 60 * 60 * 24 * 5){
            //console.log("Refresh token generated");
            response.refreshToken = generateToken(user, jwt_refresh, refresh_expiration);
        }
        return response;
    }else{
        throwError("Login required", 403);
    }
    
}   

async function getUserName(request){
    let user = await User.findById(request.userId)
    .catch(error => {
        //console.log(error);
        throwError("Not found", 404);
    })
    let toReturn = {};
    toReturn._id = user._id;
    toReturn.username = user.username;
    return toReturn;
}

async function getUserByUsername(request){
    const filter = {
        username: request.username
    };
    let user = await User.findOne(filter)
    .catch(error => {
        throwError("Not found", 404);
    })
    if(!user){
        throwError("Not found", 404);
    }
    let toReturn = {};
    toReturn._id = user._id;
    toReturn.username = user.username;
    return toReturn;
}


const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

function generateToken(user, secret, expiration){
    const accessToken = jwt.sign({ username: user.username, _id: user._id}, secret,
        {
            expiresIn: expiration
        }
    );
    return accessToken;
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

module.exports.createUser = createUser;
module.exports.loginUser = loginUser;
module.exports.logoutUser = logoutUser;
module.exports.deleteUser = deleteUser;
module.exports.getUserName = getUserName;
module.exports.refreshToken = refreshToken;
module.exports.getUserByUsername = getUserByUsername;