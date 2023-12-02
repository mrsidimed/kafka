
const { Kafka } = require("kafkajs")
const mysql = require('mysql');



// Load the configuration from the JSON file
const config = require('./params_project_mysql/typedoc_config.json');

envVars = require('./environmentVariables.json');
//var con = require('./Singleton');

const mySingletonConnection = require('./mySingletonConnection');

var dbParams, kafkaParams, intervalDuration, numberOfOrders;



if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParametersProd.json');
    kafkaParams = require('./params_kafka/kafkaParametersProd.json');

} else {

    //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParameters.json');
    kafkaParams = require('./params_kafka/kafkaParameters.json');

}




const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');





class CoffeeNotFound extends Error {
    constructor(message) {
        super(message)
        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name
        this.status = 404
    }

    statusCode() {
        return this.status
    }
}



function sleep(seconds) {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


// Mapping between document names (typedoc_config.json)and ordres.TYPEDOC numbers
const docTypeMapping = {
    passeport_normal: '6',
    passeport_vip: '7',
    carte_identite: '5',
    carte_resident: '8',
    extrait_naissance: '9'
};





/* 
 


{ 
    "clientId": "myapp1", // for local use
    "brokers": ["localhost:9092"],
    "topicProducer": "topic1",
    "topicConsumer": "topic2",
    "consumerGroupId": "test" 
}

{
    "clientId": "kafka_passeport_cid",  
    "brokers": ["192.168.7.200:30001"],
    "topicProducer": "or-document",
    "topicConsumer": "pay-or-doc",
    "consumerGroupId": "kafka_passeport_gid" 
}


 */

const kafka = new Kafka({
    // "clientId": "myapp1",
    "clientId": kafkaParams["clientId"],
    //    "brokers": ["localhost:9092"]
    "brokers": kafkaParams["brokers"]
})

const consumer = kafka.consumer({ "groupId": kafkaParams["consumerGroupId"] })


runConsumer();
const { DISCONNECT } = consumer.events
const removeListener = consumer.on(DISCONNECT, e => {

    console.log(`------------------DISCONNECT at ${e.timestamp}`);
    runConsumer();
});


//console.log("new Date().stringify()");
//etInterval( function (){getData()} , 5000);


/* getData();



var cpt = 1000;

function getData() {
    var flag = true;
 
    var handle = setInterval(

        

        function () {
            console.log("new Date().stringify()");
           
 

        }

        , 5000);

        console.log("new Date().stringify()");
        clearInterval(handle); // use  clearInterval(handle); to stop steinterval before it stars 
                                // rather than flag= true first time make flag=false
}
 */


var occupiedFlag = false;

setInterval(() => { // uncomment when mongo works


    if (!occupiedFlag) {

        occupiedFlag = true;
        getOrdre(function (err, data) {

            if (err) {

                logException(err)
            } else if (data.length > 0) {

                for (var i = 0; i < data.length; i++) {
                    data[i]['date_generation'] = new Date();

                    runProducer(data[i]);
                }

            } else {
                console.log('waiting for new orders');
            }

            occupiedFlag = false;
        });
    } else {
        console.log("curriently occupied");
    }

}
    , kafkaParams["intervalDuration"]);


function getOrdre(callback) {


    var flag = true;
    var handle = setInterval(

        function () {

            getOrdreNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 10000);



    getOrdreNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });



    function getOrdreNestedFunction(callback) {


        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {
                    logException(err);
                    flag = true;

                } else {
                    // ordres.TYPEDOC = '6' (NP : "passeport_normal")
                    // ordres.TYPEDOC = '7' (VP : "passeport_VIP")
                    // ordres.TYPEDOC = '5' (ID : "carte_identite")
                    // ordres.TYPEDOC = '8' (CR :  "carte_resident")
                    // ordres.TYPEDOC = '9' (NP : "extrait_naissance")

                    // Prepare the SQL query
                    const typedocValues = Object.keys(config)
                        .filter(key => config[key])
                        .map(key => `'${docTypeMapping[key]}'`);

                    const typedocSqlPart = `ordres.TYPEDOC IN (${typedocValues.join(', ')})`;



                    var queryOrdre = "SELECT ordres.numero , ordres.nni , ordres.PRENOM_FR as prenomFr, ordres.PRENOM_AR as prenomAr , ordres.NOM_FAMILLE_FR as nomFamilleFr ,  ordres.NOM_FAMILLE_AR as nomFamilleAr , ordres.DATE_NAISSANCE as dateNaissance, ordres.LIEU_NAISSANCE_FR as lieuNaissanceFr , ordres.LIEU_NAISSANCE_AR as lieuNaissanceAr , ordres.MONTANT as montant , ordres.TRANSPORT as transport  ,typedemande.libelle  as typeDemande , typedocument.libelle  as typeDocument  ,cac.nom_cac as cacFr , cac.nom_cac as cacAr, cac.nom_cacar as cacAr  FROM ordres inner join typedemande on typedemande.code = ordres.TYPEDEM inner join typedocument on typedocument.code = ordres.TYPEDOC inner join cac on ordres.codecac = cac.cac "
                        //   +" where sent = 0  and (ordres.TYPEDOC = '6' or ordres.TYPEDOC = '7'  ) and ordres.numero not like '00%' limit 10";
                        + "WHERE sent = 0 AND " + typedocSqlPart + " AND ordres.numero NOT LIKE '00%' LIMIT " + kafkaParams["numberOfOrders"];
 


                    con.query(queryOrdre, function (err, result, fields) {

                        if (err) {

                            logException(err + ";   error while executing query = " + queryOrdre);
                            //console.log()
                            flag = true;
                            //callback(err, null);
                        } else {

                            // clearInterval(handle);
                            var resu = JSON.parse(JSON.stringify(result));

                            callback(null, resu);
                        }


                    });


                }
            })
        }


    }



}


function updateOrdre(numero, callback) {

    var flag = true;
    var handle = setInterval(

        function () {

            updateOrdreNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })
        }
        , 10000);



    updateOrdreNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });

    function updateOrdreNestedFunction(callback) {

        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {
                    logException(err);
                    flag = true;

                } else {
                    var queryUpdateOrdre = "UPDATE ordres SET sent = 1 where NUMERO = '" + numero + "'";
                    con.query(queryUpdateOrdre, function (err, result, fields) {

                        if (err) {

                            logException(err + " error while exwcuting query : " + queryUpdateOrdre);
                            console.log("Error while executing an update query");

                            flag = true;

                        } else {
                            //clearInterval(handle);


                            callback(null, result);
                        }
                    });
                }
            })
        }
    }



}

function getOrdreById(numeroOrdreRecette, callback) {



    con.query("SELECT ordres.numero , ordres.codecac  , ordres.nni , ordres.typedoc as typedoc , ordres.PRENOM_FR as prenomFr, ordres.PRENOM_AR as prenomAr , ordres.NOM_FAMILLE_FR as nomFamilleFr ,  ordres.NOM_FAMILLE_AR as nomFamilleAr , ordres.DATE_NAISSANCE as dateNaissance, ordres.LIEU_NAISSANCE_FR as lieuNaissanceFr , ordres.LIEU_NAISSANCE_AR as lieuNaissanceAr , ordres.MONTANT as montant  , ordres.TRANSPORT as transport   ,typedemande.libelle  as typedemande , typedocument.libelle  as typedocument  ,cac.nom_cac as cacFr , cac.nom_cac as cacAr, cac.nom_cacar as cacAr  FROM ordres inner join typedemande on typedemande.code = ordres.TYPEDEM inner join typedocument on typedocument.code = ordres.TYPEDOC inner join cac on ordres.codecac = cac.cac  where numero = " + numeroOrdreRecette, function (err, result, fields) {


        if (err)
            callback(err, null);
        else
            var resu = JSON.parse(JSON.stringify(result));
        callback(null, resu);


    });

}




async function runProducer(ordre) {
    try {


        const producer = kafka.producer();
        //  console.log("Connecting.....")
        await producer.connect()
        //   console.log("Connected!")
        //A-M 0 , N-Z 1 
        //  const partition = msg[0] < "N" ? 0 : 1;
        const result = await producer.send({
            //  "topic": "topic2"  kafkaParams["topicConsumer"][],
            "topic": kafkaParams["topicProducer"],
            "messages": [
                {
                    "value": JSON.stringify(ordre),
                    "partition": 0
                }
            ]
        }).then(result => {

            if (result[0]['errorCode'] == 0) {

                console.log('');
                console.log('');
                console.log('sent data = ');
                console.log(ordre);

                updateOrdre(ordre['numero'], function (err, data) {

                    if (err) {

                        logException(err);

                    }

                });

            }

        })
            .catch(err => {
                logException(err);


            });


        await producer.disconnect();


    }
    catch (ex) {

        logException(ex);
        console.error(`Something bad happened ${ex}`)
    }


}








function insertIntoRecettes(data, callback) {



    var flag = true;
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



        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {


                if (err) {
                    logException(err);
                    flag = true;

                } else {



                    var queryIir = "SELECT ordres.numero , ordres.codecac  , ordres.nni , ordres.typedoc as typedoc , ordres.PRENOM_FR as prenomFr, ordres.PRENOM_AR as prenomAr , ordres.NOM_FAMILLE_FR as nomFamilleFr ,  ordres.NOM_FAMILLE_AR as nomFamilleAr , ordres.DATE_NAISSANCE as dateNaissance, ordres.LIEU_NAISSANCE_FR as lieuNaissanceFr , ordres.LIEU_NAISSANCE_AR as lieuNaissanceAr , ordres.MONTANT as montant  , ordres.TRANSPORT as transport   ,typedemande.libelle  as typedemande , typedocument.libelle  as typedocument  ,cac.nom_cac as cacFr , cac.nom_cac as cacAr, cac.nom_cacar as cacAr  FROM ordres inner join typedemande on typedemande.code = ordres.TYPEDEM inner join typedocument on typedocument.code = ordres.TYPEDOC inner join cac on ordres.codecac = cac.cac  where numero = " + data['ordreRecette']['numero'];
                    con.query(queryIir, function (err1, retour, fields) {



                        if (err1) {


                            logException(err1 + "error while executing query = " + queryIir);
                            flag = true;
                            //callback(err1, null);
                        }

                        else if (retour.length > 0) {

                            var Nature_encaiss = '';

                            if (retour[0]['typedoc'] == 5) {
                                Nature_encaiss = 'CNI';
                            } else if (retour[0]['typedoc'] == 6) {
                                Nature_encaiss = 'NP';
                            } else if (retour[0]['typedoc'] == 7) {
                                Nature_encaiss = 'VIP';
                            } else if (retour[0]['typedoc'] == 8) {
                                Nature_encaiss = 'CR';
                            }


                            var queryInsertPdf2 = "Insert Into  recettes_pdf(   Quittance ,quittance_pdf ) " +
                                "VALUES (    '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['quittanceB64'] + "' )";
                            var queryInsertion = "Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone  ) " +
                                "VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + retour[0]['transport'] + " ," + retour[0]['montant'] + ", '" + retour[0]['codecac'] + "' , 'Reçue', SYSDATE() , '" + data['ordreRecette']['numero'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "'  )";

                            //executeTwoStatementsWithCommit(queryInsertion, queryInsertPdf2);
                            //executeTwoQueries(queryInsertion, queryInsertPdf2);
                            executeTwoQueries(queryInsertion, queryInsertPdf2, function (err, results) {
                                console.log("inside insert recette 5");
                                if (err) {
                                    console.log('An error occurred: ', err);
                                } else {
                                    console.log('Queries executed successfully: ', results);
                                    callback(null, results)
                                }
                            });
                            // con.query(queryInsertion, function (err2, result, fields) {

                            //     if (err2) {
                            //         logException(err2 + " ; error while executing  query : " + queryInsertion);
                            //         flag = true;
                            //         // callback(err2, null);

                            //     } else {

                            //         var queryInsertPdf = "Insert Into  recettes_pdf(   Quittance ,quittance_pdf ) " +
                            //             "VALUES (    '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['quittanceB64'] + "' )";
                            //         con.query(queryInsertPdf, function (err3, result, fields) {

                            //             if (err3) {
                            //                 logException(err3 + " error while executing query :  " + queryInsertPdf);
                            //                 flag = true;
                            //                 // callback(err3, null);
                            //             } else {
                            //                 callback(null, result);
                            //             }

                            //         });
                            //     }
                            // });



                        }

                    });
                }
            })
        }


    }
}




function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
async function runConsumer() {



    try {

        var recette = {};
        // //start of a test




                        // //data['numeroOrdreRecette'] = '060401511120007';



                        // recette['ordreRecette'] = {
                        //     'numero': '060401511120007'
                        // }
                        // recette['reference'] = 'myreference';
                        // recette['serviceBancaire'] = 'myserviceBancaire';
                        // recette['idTransaction'] = 'myidTransaction' + getRandomNumberBetween(0, 1000000);
                        // recette['datePaiement'] = '2020-04-17';
                        // //data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

                        // recette['quittance'] = {
                        //     'quittanceNo': '' + getRandomNumberBetween(0, 1000000)
                        // }
                        // recette['numeroTelephone'] = '36055868';
                        // recette['quittanceB64'] = 'base64Image';





                        // insertIntoRecettes(recette, function (err, data) { // uncomment when mongo works

                        //     console.log("inside insertIntoRecettes");
                        //     console.log(recette);

                        //     if (err) {

                        //         logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                        //         saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                        //         //   throw err;
                        //     } else {
                        //         //saveDataWithoutException(JSON.stringify(recette), recette['idTransaction']);
                        //         console.log('a row is inserted');



                        //         setAsAcquite(recette['ordreRecette']['numero'], function (err, data) {

                        //             if (err) {

                        //                 logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                        //                 saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                        //                 //   throw err;
                        //             } else {
                        //                 //saveDataWithoutException(JSON.stringify(recette), recette['idTransaction']);
                        //                 console.log(' and Nrecette are updated');
                        //             }

                        //         });
                        //     }

                        // });


        //end of a test



        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        console.log("kafkaParams['topicConsumer'] =" + kafkaParams["topicConsumer"]);
        await consumer.subscribe({
            //  "topic": "topic1",
            "topic": kafkaParams["topicConsumer"],
            "fromBeginning": true
        })




        await consumer.run({


            "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
                console.log('')
                console.log('')
                //console.log(`received data =  ${result.message.value} `);

                //console.log(result.message.value);
                recette = JSON.parse(`${result.message.value}`);
                paiement = JSON.parse(`${result.message.value}`);
                paiement['quittanceB64'] = null;

                logPaiement(JSON.stringify(paiement));
                console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);


                /* fs.writeFile('test.txt', JSON.stringify(recette), err => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    //file written successfully
                });
 */

                insertIntoRecettes(recette, function (err, data) { // uncomment when mongo works

                    console.log("inside insertIntoRecettes");

                    if (err) {

                        logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                        saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                        //   throw err;
                    } else {
                        //saveDataWithoutException(JSON.stringify(recette), recette['idTransaction']);
                        console.log('a row is inserted');

                        setAsAcquite(recette['ordreRecette']['numero'], function (err, data) {

                            if (err) {

                                logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                                saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                                //   throw err;
                            } else {
                                //saveDataWithoutException(JSON.stringify(recette), recette['idTransaction']);
                                console.log('acquite is updated');
                            }

                        });
                    }

                });



            }
        })

    }
    catch (ex) {


        logException(ex);

        if (recette['idTransaction']) {
            saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
        }

        var myError = "" + ex;

        if (myError.includes("KafkaJSNumberOfRetriesExceeded")) {

            runConsumer();

        }

        //console.log(ex);
        // console.error(`Something bad happened ${ex}`)
    }
    finally {

    }


}


function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}


function logPaiement(paiement) {

    console.log("inside paiement");
    if (!fs.existsSync('./paiements')) {
        fs.mkdirSync('./paiements');
    }
    fs.appendFileSync('./paiements/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + paiement + '\n\n');

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



function setAsAcquite(numero, callback) {

    var flag = true;
    var handle = setInterval(

        function () {

            setAsAcquiteNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })
        }
        , 10000);



    setAsAcquiteNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });

    function setAsAcquiteNestedFunction(callback) {

        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {
                    logException(err);
                    flag = true;

                } else {

                    var queryUpdateAcquite = "UPDATE ordres SET acquite = 1, Nrecette = 'PE' where NUMERO = '" + numero + "'";
                    con.query(queryUpdateAcquite, function (err, result, fields) {

                        if (err) {

                            logException(err + " ; error while executing query : " + queryUpdateAcquite);
                            console.log("Error while executing an update query");

                            flag = true;

                        } else {
                            //clearInterval(handle);


                            callback(null, result);
                        }
                    });
                }
            })
        }
    }




}

function executeTwoQueries(query1, query2, callback) {

    console.log("inside insert recette 4");
    const db = mysql.createConnection({
        host: dbParams['host'],
        user: dbParams['user'],
        password: dbParams['password'],
        database: dbParams['database']
    });

    db.connect(function (err) {
        if (err) {
            console.error('Error connecting to the database', err);
            logException(err);
            db.end();
            return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
        }

        db.beginTransaction(function (err) {
            if (err) {
                console.log('Error in transaction', err);
                logException(err);
                db.end();
                return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
            }

            db.query(query1, function (error, results, fields) {
                if (error) {
                    return db.rollback(function () {
                        console.log('Error in first query', error);
                        logException(error);
                        db.end();
                        return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
                    });
                }

                db.query(query2, function (error, results, fields) {
                    if (error) {
                        return db.rollback(function () {
                            console.log('Error in second query', error);
                            logException(error);
                            db.end();
                            return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
                        });
                    }

                    db.commit(function (err) {
                        if (err) {
                            return db.rollback(function () {
                                console.log('Error in commit', err);
                                logException(err);
                                db.end();
                                return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
                            });
                        }
                        console.log('Both queries were successful!');
                        db.end();
                        return callback(null, results);
                    });
                });
            });
        });
    });
}



// function executeTwoQueries(query1, query2) {

//     const db = mysql.createConnection({
//         host: dbParams['host'],
//         user: dbParams['user'],
//         password: dbParams['password'],
//         database: dbParams['database']
//     });

//     db.connect(function (err) {
//         if (err) {

//             console.error('Error connecting to the database', err);
//             logException(err);
//             return setTimeout(() => executeTwoQueries(query1, query2), 5000);
//         }

//         db.beginTransaction(function (err) {
//             if (err) {

//                 console.log('Error in transaction, retrying in 5 seconds', err);
//                 logException(err);
//                 return setTimeout(() => {
//                     db.end();
//                     executeTwoQueries(query1, query2);
//                 }, 5000);
//             }

//             db.query(query1, function (error, results, fields) {
//                 if (error) {
//                     return db.rollback(function () {
//                         console.log('Error in first query, retrying in 5 seconds', error);
//                         logException(error);
//                         setTimeout(() => {
//                             db.end();
//                             executeTwoQueries(query1, query2);
//                         }, 5000);
//                     });
//                 }

//                 db.query(query2, function (error, results, fields) {
//                     if (error) {
//                         return db.rollback(function () {
//                             console.log('Error in second query, retrying in 5 seconds', error);
//                             logException(error);
//                             setTimeout(() => {
//                                 db.end();
//                                 executeTwoQueries(query1, query2);
//                             }, 5000);
//                         });
//                     }

//                     db.commit(function (err) {
//                         if (err) {
//                             db.rollback(function () {
//                                 console.log('Error in commit, retrying in 5 seconds', err);
//                                 logException(err);
//                                 setTimeout(() => {
//                                     db.end();
//                                     executeTwoQueries(query1, query2);
//                                 }, 5000);
//                             });
//                             return;
//                         }
//                         console.log('Both queries were successful!');
//                         db.end();
//                     });
//                 });
//             });
//         });
//     });
// }




