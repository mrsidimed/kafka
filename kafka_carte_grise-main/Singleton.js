











/* const { Client } = require('pg');
const fs = require('fs');
envVars = require('./environmentVariables.json');






var dbParams, kafkaParams;


if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParams = require('./dbParametersProd.json');
    kafkaParams = require('./kafkaParametersProd.json');

} else {

    //  recettesFolder = "recettes/"
    dbParams = require('./dbParameters.json');
    kafkaParams = require('./kafkaParameters.json');

}


const con = new Client({
    user: dbParams['user'],
    host: dbParams['host'],
    database: dbParams['database'],
    password: dbParams['password'],
    port: dbParams['port'],
});

console.log("------------------------------------ inside");
con.connect(function (err) {
    if (err) {

        logException(err);
       // throw err;
    }

});




function logException(error) {
 

    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');
    
}


 

module.exports = con;



 */





/* class PrivateSingleton {
    con = mysql.createConnection({
        host: dbParams['host'],
        user: dbParams['user'],
        password: dbParams['password'],
        database: dbParams['database']

    });

    constructor() {

        
        this.message = 'I am an instance';
    }
}
class Singleton {
    constructor() {
        throw new Error('Use Singleton.getInstance()');
    }
    static getInstance() {
        if (!Singleton.instance) {
            Singleton.instance = new PrivateSingleton();
        }
        return Singleton.instance;
    }
}

var Singleton = (function () {

    con = mysql.createConnection({
        host: dbParams['host'],
        user: dbParams['user'],
        password: dbParams['password'],
        database: dbParams['database']

    });
    var instance;

    function createInstance() {

        console.log("create");

        return con.connect();

    }

    return {
        getInstance: function () {
            if (!instance) {
                console.log("inside ");
                instance = createInstance();
            }
            return instance;
        }
    };
})();
module.exports = Singleton; */