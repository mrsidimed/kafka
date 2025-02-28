const { Client } = require('pg');
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

connection = null;
class singletonConnection {

    constructor() {


    }

    destroyConnection(callback) {
        if (connection) {
            connection.end();
        }

        connection = null;
        return callback(null, true);
    }

    getConnection(callback) {


        // console.log("request for connection");
        if (connection) {

            return callback(null, connection);

        } else {


            const con = new Client({
                user: dbParams['user'],
                host: dbParams['host'],
                database: dbParams['database'],
                password: dbParams['password'],
                port: dbParams['port'],
            });

            con.connect(function (err) {

                if (err) {

                    console.log("error while connectig to the DB");

                    return callback(err+ "; error while connectig to the DB", null);

                } else {

                    connection = con;
                    return callback(null, connection);

                }

            });

            con.on('error', function (err) {

                console.log("error while connectig to the DB 2");
                // return callback(err, null);

            });



        }


    }

}

const mySingletonConnection = new singletonConnection();


module.exports = mySingletonConnection;