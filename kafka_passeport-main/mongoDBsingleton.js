// db.js
const mongoose = require('mongoose');
let connection = null;

envVars = require('./environmentVariables.json');

if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParamsMongo = require('./params_project_mongo/db_params_prod.json');
 

} else {

    //  recettesFolder = "recettes/"
    dbParamsMongo = require('./params_project_mongo/db_paramas_dev.json');
 

}

//start

 


const DB_USER = dbParamsMongo['database']['user'];
const DB_PASSWORD = encodeURIComponent(dbParamsMongo['database']['password']); // Ensure password is URL encoded in case of special characters
const DB_NAME = dbParamsMongo['database']['name'];
const HOST = dbParamsMongo['database']['host'];


// const DB_USER = 'root';
// const DB_PASSWORD = encodeURIComponent('password'); // Ensure password is URL encoded in case of special characters
// const DB_NAME = 'anrpts';
// const HOST = 'localhost:27017';

const MONGODB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${HOST}/${DB_NAME}?authSource=admin`; // Assumes the authentication source is "admin"



// Mongoose connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};


//end


async function connectToMongoDB() {
    if (connection && mongoose.connection.readyState === 1) {
        return connection;
    }

    connection = await mongoose.connect(MONGODB_URI, options);
    return connection;
}

module.exports = connectToMongoDB;