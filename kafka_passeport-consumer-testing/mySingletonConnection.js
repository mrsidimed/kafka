const mysql = require('mysql');
envVars = require('./environmentVariables.json');




var dbParams;


if (envVars['production']) {
    dbParams = require('./params_project_mysql/dbParametersProd.json');
} else {
    dbParams = require('./params_project_mysql/dbParameters.json');
}


connection = null;
class singletonConnection {

    constructor() {


    }

    getConnection(callback) {


        if (connection && connection.state !== 'disconnected') {

            return callback(null, connection);

        } else {

            var mycon = mysql.createConnection({
                host: dbParams['host'],
                user: dbParams['user'],
                password: dbParams['password'],
                database: dbParams['database']

            });

            mycon.connect(function (err) {

                if (err) {
                  
                    console.log("error while connectig to the DB");
		    console.log("err = "+err);

                    return callback(err, null);

                } else {

                    console.log("connected to db");

                    connection = mycon;
                    return callback(null, connection);

                }

            });



            mycon.on('error', function (err) {
                return callback(err, null);

            });


        }


    }

}

const mySingletonConnection = new singletonConnection();


module.exports = mySingletonConnection;
