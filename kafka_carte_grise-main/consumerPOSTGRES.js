
const { Kafka } = require("kafkajs")
const { Client } = require('pg');
const mysql = require('mysql');

//var con = require('./Singleton');
const mySingletonConnection = require('./mySingletonConnection');

//import dbParams from ('./dbParameters.json')


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


envVars = require('./environmentVariables.json');




var dbParams, kafkaParams;


/* 

{

    "user": "postgres" ,
    "host":  "localhost" ,
    "database": "cartegrise"  ,
    "password": "postgres"  ,
    "port": 5433

}
 */


if (envVars['production']) {

    dbParams = require('./dbParametersProd.json');
    kafkaParams = require('./kafkaParametersProd.json');

} else {


    dbParams = require('./dbParameters.json');
    kafkaParams = require('./kafkaParameters.json');

}



 


/* {

    "user": "postgres",
    "host": "10.10.100.207",
    "database": "cartegrise",
    "password": "postgres",
    "port": 5432

}


{

    "user": "postgres",
    "host": "localhost",
    "database": "cartegrise",
    "password": "postgres",
    "port": 5433

} 


{
    "clientId": "myapp1",  // for localUse
    "brokers": ["localhost:9092"],
    "topicProducer": "carte-grise-producer-topic",
    "topicConsumer": "carte-grise-consumer-topic",
    "consumerGroupId": "test" 
}

{
    "clientId": "kafka_carte_grise_cid",  // for server use
    "brokers": ["192.168.7.200:30001"],
    "topicProducer": "or-carte-grise",
    "topicConsumer": "pay-or-cg",
    "consumerGroupId": "kafka_carte_grise_gid" 
}

*/


// use id_certificat 1088 et 589 pour les test

const kafka = new Kafka({
    "clientId": kafkaParams['clientId'],
    "brokers": kafkaParams['brokers']
})

const consumer = kafka.consumer({ "groupId": kafkaParams['consumerGroupId'] })

runConsumer();

const { DISCONNECT } = consumer.events
const removeListener = consumer.on(DISCONNECT, e => { 

    console.log(`------------------DISCONNECT at ${e.timestamp}`);
    runConsumer();
});



async function runConsumer() {
    try {


        


        console.log("heyffffff");
        var data={};
                 
        data['numeroOrdreRecette'] = '578/DTT/22';
        data['reference'] = 'myreference';
        data['serviceBancaire'] = 'myserviceBancaire';
        data['idTransaction'] = 'myidTransaction';
        data['datePaiement'] = '2022-05-17';
        data['numeroQuittance'] = 'mynumeroQuittance8979';
        data['numeroTelephone'] = '36000000';
        data['quittanceB64'] = "base64Image";
        data['ordreRecette'] = {
            "numero": "588/DTT/22"
        };
        
        data['quittance']['quittanceNo'] = 'myQuittanceNumber'
        
        
        insertIntoRecettes(data, function (err, data) {


            console.log("pppppp");
        
            if (err) {
                console.log(err)
                logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
        
                //throw err;
            } else {
                console.log('a row is inserted');
            }
        
        });
        

        console.log("pppppp");
        
        var recette = {};
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            "topic": kafkaParams['topicConsumer'],
            "fromBeginning": true
        })




        await consumer.run({
            "eachMessage": async result => {

                console.log('')
                console.log('')
                //console.log(`received data =  ${result.message.value} `);



                recette = JSON.parse(`${result.message.value}`);
                console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);

                /* fs.writeFile('test.txt', JSON.stringify(recette), err => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    //file written successfully
                }); */




                insertIntoRecettes(recette, function (err, data) {


                    if (err) {
                        logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                        saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                        //throw err;
                    } else {
                        console.log('a row is inserted');
                    }

                });



            }
        })

    }
    catch (ex) {
        logException(ex);

        // if (recette['idTransaction']) {
        //     saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
        // }

        var myError = ""+ex;

        if(myError.includes("KafkaJSNumberOfRetriesExceeded")){

            runConsumer();
            
        }
        // console.error(`Something bad happened ${ex}`)
    }
    finally {

    }


}


function insertIntoRecettes(data, callback) {


    
    var iirflag = true;
    var handle = setInterval(

        function () {

            insertIntoRecettesNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 10000);



    insertIntoRecettesNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });



    function insertIntoRecettesNestedFunction(callback) {

        if (iirflag) {

            iirflag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {

                    logException(err);
                    mySingletonConnection.destroyConnection(function (err1, con) {
                        iirflag = true;
                    });

                } else {

                    query = "Insert Into  recettes ( date_validation , path ,paiement_en_ligne ,    etat            , date_quittance                , reference                    , serviceBancaire                   , idTransaction                    , Quittance                          , numeroTelephone  , quittance_pdf , numero_recette ) \
                            VALUES (  now()        , 'none'  , 1                 ,  'Reçue'    , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "' ,  '" + data['quittanceB64'] + "'  , '" + data['ordreRecette']['numero'] + "'    )"

                    con.query(query, (err2, res) => {

                        if (err2) {
                            logException(err2 +"  ; error while executing query = "+query);
                            mySingletonConnection.destroyConnection(function (err1, con) {
                                iirflag = true;
                            })
                        } else {
                            callback(null, res);
                        }

                    });

                }
            })
        }
    }


};



function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}

function saveDataDuringException(data, id) {


    if (!fs.existsSync('./dataNotSavedInDB')) {
        fs.mkdirSync('./dataNotSavedInDB');
    }
    fs.appendFileSync('./dataNotSavedInDB/' + id, data);

}


function saveDataWithoutException(data, id) {


    if (!fs.existsSync('./dataSavedInDB')) {
        fs.mkdirSync('./dataSavedInDB');
    }
    fs.appendFileSync('./dataSavedInDB/' + id, data);

}


/* 
function insertIntoRecettesOLD(data, callback) {

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "recettes"
    });

    console.log(' data = ' + JSON.stringify(data));
  

    //data['numeroOrdreRecette'] 
    getOrdreById(data['numeroOrdreRecette'], function (err, retour) {

        if (retour.length > 0) {
            console.log('retour ' + JSON.stringify(retour));

            //------------------------------------------------>

            var datePaiement = data['datePaiement'];
            var Nature_encaiss = '';
            const myArray = datePaiement.split("-");
 

            var name = recettesFolder + retour[0]['codecac'] + '/' + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/' + data['numeroQuittance'] + '.pdf';

            console.log('typedoc = ' + retour[0]['typedoc']);
            if (retour[0]['typedoc'] == 5) {
                Nature_encaiss = 'CNI';
            } else if (retour[0]['typedoc'] == 6) {
                Nature_encaiss = 'NP';
            } else if (retour[0]['typedoc'] == 7) {
                Nature_encaiss = 'VIP';
            } else if (retour[0]['typedoc'] == 8) {
                Nature_encaiss = 'CR';
            }
            // (5 = CNI) (6 NP) (7 VIP) (8 CR)

            data['path'] = name;

            var document = data['ordreRecette'];
            console.log();

            var dir = recettesFolder + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFile(name, document, { encoding: 'base64' }, function (err) {
                if (err)
                    throw err;
                else
                    console.log('File created ');
            });

            //<------------------------------------------------

            con.connect(function (err) {
                if (err) throw err;
                //con.query("Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette , path  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone ) VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + retour[0]['transport'] + " ," + retour[0]['montant'] + ", '" + retour[0]['codecac'] + "' , 'Reçue', SYSDATE() , '" + data['numeroOrdreRecette'] + "' ,  '" + data['path'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['numeroQuittance'] + "'  ,  '" + data['numeroTelephone'] + "' )", function (err, result, fields) {

                con.query("Insert Into  recettes ( date_validation , paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone ) VALUES (  SYSDATE() , 1 , " + retour[0]['transport'] + " ," + retour[0]['montant'] + ", '" + retour[0]['codecac'] + "' , 'Reçue', SYSDATE() , '" + data['numeroOrdreRecette'] + "'    , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['numeroQuittance'] + "'  ,  '" + data['numeroTelephone'] + "' )", function (err, result, fields) {

                    if (err)
                        callback(err, null);

                    else
                        callback(null, result);

                    con.end(function (err) {
                        if (err) throw (err);
                        else {
                            //        console.log('The database connection has been terminated.');
                        }
                    });
                });

            });
        }
        //console.log(data);



    });


} */
