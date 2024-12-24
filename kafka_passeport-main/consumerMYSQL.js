
const { Kafka } = require("kafkajs")
const mysql = require('mysql');



envVars = require('./environmentVariables.json');
//var con = require('./Singleton');

const mySingletonConnection = require('./mySingletonConnection');

var dbParamsMysql, kafkaParams, dbParamsMongo;



if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParamsMongo = require('./params_project_mongo/db_params_prod.json');
    dbParamsMysql = require('./params_project_mysql/dbParametersProd.json');
    kafkaParams = require('./params_kafka/kafkaParametersProd.json');

} else {

    //  recettesFolder = "recettes/"
    dbParamsMongo = require('./params_project_mongo/db_paramas_dev.json');
    dbParamsMysql = require('./params_project_mysql/dbParameters.json');
    kafkaParams = require('./params_kafka/kafkaParameters.json');

}




const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


//start



//end









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















function insertIntoRecettes(data, callback) {


    console.log("--------->mydebut " + data['quittance']['quittanceNo'] + " " + Date.now());


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



                    let ordreRecetteNumero = data['ordreRecette']['numero'];
                    let codecac, typedoc, transport = 0;

                    if (ordreRecetteNumero.startsWith('8')) {

                        codecac = '800000';
                        typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0

                    } else if (ordreRecetteNumero.startsWith('9')) {
                        codecac = '900000';
                        typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0
                    } else {
                        codecac = ordreRecetteNumero.slice(0, 6); // First 6 characters
                        typedoc = parseInt(ordreRecetteNumero.charAt(6));   // 7th character
                    }


                    var Nature_encaiss = '';

                    if (typedoc == 5) {
                        Nature_encaiss = 'CNI';
                    } else if (typedoc == 6) {
                        Nature_encaiss = 'NP';
                    } else if (typedoc == 7) {
                        Nature_encaiss = 'VIP';
                    } else if (typedoc == 8) {
                        Nature_encaiss = 'CR';
                    } else if (typedoc == 9) {
                        Nature_encaiss = 'EXTR';
                    } else if (typedoc == 4) {
                        Nature_encaiss = 'CJ';
                    }


                    var mynewdate = formatDate(new Date());



                    console.log("mynewdate " + mynewdate);
                    var queryInsertPdf2 = "Insert Into  recettes_pdf(   Quittance ,quittance_pdf ) " +
                        "VALUES (    '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['quittanceB64'] + "' )";
                    var queryInsertion = "Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone  ) " +
                        "VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + transport + " ," + data['ordreRecette']['montant'] + ", '" + codecac + "' , 'Reçue', '" + mynewdate + "' , '" + data['ordreRecette']['numero'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "'  )";
                    var queryUpdateAcquite = "UPDATE ordres SET acquite = 1, Nrecette = 'PE' where NUMERO = '" + data['ordreRecette']['numero'] + "'";


                    //executeThreeQueries(queryInsertion, queryInsertPdf2, queryUpdateAcquite, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], function (err, results) {
                    executeTwoQueries(queryInsertion, queryInsertPdf2, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], function (err, results) {
                        console.log("inside insert recette 5");


                        if (err == null && results == null) {

                            console.log('data not inserted because');
                            callback(null, null);
                        } else if (err != null) {

                            logException(err);
                            console.log('An error occurred: ', err);

                            logException(data['ordreRecette']['numero'] + " is beeing reinserted reinserted ");
                            console.log(data['ordreRecette']['numero'] + " is beeing reinserted reinserted ");
                            //return setTimeout(() => executeThreeQueries(queryInsertion, queryInsertPdf2, queryUpdateAcquite, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], callback), 5000);
                            return setTimeout(() => executeTwoQueries(queryInsertion, queryInsertPdf2, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], callback), 5000);

                        } else {
                            console.log('Queries executed successfully: ');
                            callback(null, results);
                        }
                    });


                }
            })
        }


    }
}




async function runConsumer() {


    var recette = {};


    try {


        //    console.log("---------------------------------------------------------------------");

        //    recette['ordreRecette'] = {
        //        'numero': '060401511120007',
        //        'montant': 3000
        //    }

        //    recette['ordreRecette']['montant']

        //    recette['reference'] = 'myreference';
        //    recette['serviceBancaire'] = 'myserviceBancaire';

        //    recette['datePaiement'] = '2020-04-17';
        //    recette['numeroTelephone'] = '36055860';
        //    recette['quittanceB64'] = 'base64Image';
        //    //data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

        //    recette['quittance'] = {
        //       // 'quittanceNo': '' + getRandomNumberBetween(0, 1000000)
        //        'quittanceNo': '' +685449
        //    }


        //    // recette['quittance'] = {
        //    //     'quittanceNo': 'maQuittance'  
        //    // }


        //    recette['idTransaction'] = 'myidTransaction' + getRandomNumberBetween(0, 1000000);

        //    //recette['idTransaction'] = 'myidTransaction' ;


        //    insertIntoRecettes(recette, function (err, data) {

        //        if (err) {

        //            logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);

        //        } else {

        //            console.log('Two rows inserted and one row updated');

        //        }

        //    });











        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        console.log("kafkaParams['topicConsumer'] =" + kafkaParams["topicConsumer"]);
        await consumer.subscribe({
            //  "topic": "topic1",
            "topic": kafkaParams["topicConsumer"],
            "fromBeginning": true
        })



        console.log("waiting for recettes ===========");
        let quittanceNos = [];
        let maxLength = 1000;

        const util = require('util');
        const insertIntoRecettesAsync = util.promisify(insertIntoRecettes);

        await consumer.run({


            "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
                console.log('')
                console.log('')

                recette = JSON.parse(`${result.message.value}`);
                paiement = JSON.parse(`${result.message.value}`);

                //console.log(recette)
                paiement['quittanceB64'] = null;

                logPaiement(JSON.stringify(paiement));
                console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);


                // Get the quittanceNo
                let quittanceNo = recette['quittance']['quittanceNo'];

                // Add to the list if not already present
                if (!quittanceNos.includes(quittanceNo)) {
                    //if (true) {

                    quittanceNos.push(quittanceNo);

                    console.log("quittanceNos.length = " + quittanceNos.length);



                    // Keep only the last maxLength unique values
                    if (quittanceNos.length > maxLength) {
                        quittanceNos.shift();
                    }

                    // console.log("---->debut "+recette['quittance']['quittanceNo']);
                    // insertIntoRecettes(recette, function (err, data) {
                    //     if (err) {
                    //         console.error("Error in insertIntoRecettes:", err);
                    //     } else {
                    //         console.log("---->fin "+data);
                    //         //console.log("insertIntoRecettes success:", data);
                    //     }
                    // });





                    try {

                        // console.log("---->debut " + recette['quittance']['quittanceNo']+" : "+ Date.now());
                        await insertIntoRecettesAsync(recette);
                        //  console.log("---->fin " + recette['quittance']['quittanceNo']+" : "+ Date.now());
                    } catch (err) {
                        console.error("Error in insertIntoRecettes:", err);
                    }


                } else {

                    console.log("Duplicata error detected and avoided quittanceNo : " + quittanceNo);
                    logException("Duplicata error detected and avoided quittanceNo : " + quittanceNo);

                }




            }
        })


    }
    catch (ex) {

        console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");
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






function formatDate(date) {
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}



function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' consumerMYSQL: ' + error + '\n\n');

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



function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}



function logTimestampBeforeAndAfterInsertion(timestampBefore, timestampAfter, timeDifference, numeroOrdre) {

    console.log('timeDiffSeconds: ' + timeDifference + ',          timestampBefore: ' + timestampBefore + ',       timestampAfter  : ' + timestampAfter + ',         numeroOrdre: ' + numeroOrdre + ' \n\n')
    if (!fs.existsSync('./logsInsertion')) {
        fs.mkdirSync('./logsInsertion');
    }
    fs.appendFileSync('./logsInsertion/' + new Date().toISOString().split('T')[0], 'timeDiffSeconds: ' + timeDifference + ',          timestampBefore: ' + timestampBefore + ',       timestampAfter  : ' + timestampAfter + ',         numeroOrdre: ' + numeroOrdre + ' \n\n');

}



function executeThreeQueries(query1, query2, query3, numero, typeDoc, quittanceNO, callback) {
    console.log("inside executeThreeQueries");

    flag = true;
    const timestampStart = new Date();

    mySingletonConnection.getConnection((err, db) => {
        if (err) {
            console.error('Error connecting to the database', err);
            logException('' + err);
            return callback(new Error('error in executing3queries'), null);
        }

        console.log("Database connection established");

        db.beginTransaction(function (err) {
            if (err) {
                console.log('Error in transaction', err);
                logException('' + err);
                return callback(new Error('error in executing3queries'), null);
            }

            console.log("Transaction started");

            db.query(query1, function (error, results1, fields) {
                if (error) {
                    console.log('Error in first query', error);
                    logException('' + error);

                    if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                        var mytimestamp = new Date();
                        console.error('Duplicate entry detected. Aborting transaction.' + mytimestamp);
                        logException('Duplicate entry detected. Aborting transaction.');
                        return callback(null, null);
                    }

                    return db.rollback(function () {
                        console.error('Rollback due to first query error');
                        return callback(new Error('error in executing3queries'), null);
                    });
                }

                // If typeDoc is 9, commit after the first query
                if (typeDoc == 9) {
                    db.commit(function (err) {
                        if (err) {
                            console.log('Error in commit', err);
                            logException('' + err);
                            return db.rollback(function () {
                                console.error('Rollback due to commit error');
                                return callback(new Error('error in executing3queries'), null);
                            });
                        }

                        const timestampEnd = new Date();
                        const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                        logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                        console.log('Query1 was successful!');
                        console.log('------>myfin ' + quittanceNO + ' ' + Date.now());
                        return callback(null, quittanceNO);


                    });
                } else {
                    // Proceed with the second and third queries
                    db.query(query2, function (error, results2, fields) {
                        if (error) {
                            console.log('Error in second query', error);
                            logException('' + error);

                            if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                                console.error('Duplicate entry detected. Aborting transaction.');
                                logException('Duplicate entry detected. Aborting transaction.');
                                return callback(null, null);
                            }

                            return db.rollback(function () {
                                console.error('Rollback due to second query error');
                                return callback(new Error('error in executing3queries'), null);
                            });
                        }

                        db.query(query3, function (error, results3, fields) {
                            if (error) {
                                flag = false;
                                console.log('Error in third query', error);
                                logException('' + error);

                                if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                                    console.error('Duplicate entry detected. Aborting transaction.');
                                    logException('Duplicate entry detected. Aborting transaction.');
                                    return callback(null, null);
                                }

                                return db.rollback(function () {
                                    console.error('Rollback due to third query error');
                                    return callback(new Error('error in executing3queries'), null);
                                });
                            }

                            db.commit(function (err) {
                                if (err) {
                                    console.log('Error in commit', err);
                                    logException('' + err);
                                    return db.rollback(function () {
                                        console.error('Rollback due to commit error');
                                        return callback(new Error('error in executing3queries'), null);
                                    });
                                }

                                const timestampEnd = new Date();
                                const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                                logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                                console.log('All three queries were successful!');

                                console.log('------>myfin ' + quittanceNO);
                                return callback(null, quittanceNO);
                            });
                        });
                    });
                }
            });
        });
    });
}







function executeTwoQueries(query1, query2, numero, typeDoc, quittanceNO, callback) {
    console.log("inside executeTwoQueries");

    flag = true;
    const timestampStart = new Date();

    mySingletonConnection.getConnection((err, db) => {
        if (err) {
            console.error('Error connecting to the database', err);
            logException('' + err);
            return callback(new Error('error in executing3queries'), null);
        }

        console.log("Database connection established");

        db.beginTransaction(function (err) {
            if (err) {
                console.log('Error in transaction', err);
                logException('' + err);
                return callback(new Error('error in executing3queries'), null);
            }

            console.log("Transaction started");

            db.query(query1, function (error, results1, fields) {
                if (error) {
                    console.log('Error in first query', error);
                    logException('' + error);

                    if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                        var mytimestamp = new Date();
                        console.error('Duplicate entry detected. Aborting transaction.' + mytimestamp);
                        logException('Duplicate entry detected. Aborting transaction.');
                        return callback(null, null);
                    }

                    return db.rollback(function () {
                        console.error('Rollback due to first query error');
                        return callback(new Error('error in executing3queries'), null);
                    });
                }

                // If typeDoc is 9, commit after the first query
                if (typeDoc == 9) {
                    db.commit(function (err) {
                        if (err) {
                            console.log('Error in commit', err);
                            logException('' + err);
                            return db.rollback(function () {
                                console.error('Rollback due to commit error');
                                return callback(new Error('error in executing3queries'), null);
                            });
                        }

                        const timestampEnd = new Date();
                        const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                        logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                        console.log('Query1 was successful!');
                        console.log('------>myfin ' + quittanceNO + ' ' + Date.now());
                        return callback(null, quittanceNO);


                    });
                } else {
                    // Proceed with the second and third queries
                    db.query(query2, function (error, results2, fields) {
                        if (error) {
                            console.log('Error in second query', error);
                            logException('' + error);

                            if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                                console.error('Duplicate entry detected. Aborting transaction.');
                                logException('Duplicate entry detected. Aborting transaction.');
                                return callback(null, null);
                            }

                            return db.rollback(function () {
                                console.error('Rollback due to second query error');
                                return callback(new Error('error in executing3queries'), null);
                            });
                        }


                        db.commit(function (err) {
                            if (err) {
                                console.log('Error in commit', err);
                                logException('' + err);
                                return db.rollback(function () {
                                    console.error('Rollback due to commit error');
                                    return callback(new Error('error in executing2queries'), null);
                                });
                            }

                            const timestampEnd = new Date();
                            const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                            logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                            console.log('All Two queries were successful!');

                            console.log('------>myfin ' + quittanceNO);
                            return callback(null, quittanceNO);
                        });

                        // db.query(query3, function (error, results3, fields) {
                        //     if (error) {
                        //         flag = false;
                        //         console.log('Error in third query', error);
                        //         logException('' + error);

                        //         if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
                        //             console.error('Duplicate entry detected. Aborting transaction.');
                        //             logException('Duplicate entry detected. Aborting transaction.');
                        //             return callback(null, null);
                        //         }

                        //         return db.rollback(function () {
                        //             console.error('Rollback due to third query error');
                        //             return callback(new Error('error in executing3queries'), null);
                        //         });
                        //     }

                        //     db.commit(function (err) {
                        //         if (err) {
                        //             console.log('Error in commit', err);
                        //             logException('' + err);
                        //             return db.rollback(function () {
                        //                 console.error('Rollback due to commit error');
                        //                 return callback(new Error('error in executing3queries'), null);
                        //             });
                        //         }

                        //         const timestampEnd = new Date();
                        //         const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                        //         logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                        //         console.log('All three queries were successful!');

                        //         console.log('------>myfin ' + quittanceNO);
                        //         return callback(null, quittanceNO);
                        //     });
                        // });
                    });
                }
            });
        });
    });
}



// function executeThreeQueries(query1, query2, query3, numero, callback) {
//     console.log("inside executeThreeQueries" );

//     flag = true;
//     const timestampStart = new Date();

//     mySingletonConnection.getConnection((err, db) => {
//         if (err) {

//             console.error('Error connecting to the database', err);
//             logException('' + err);

//             //throw new Error('error in executing3queries');
//             return callback(new Error('error in executing3queries'), null);
//             //return callback(null, false);
//             //return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//         }

//         console.log("Database connection established");

//         db.beginTransaction(function (err) {
//             if (err) {


//                 console.log('Error in transaction', err);
//                 logException('' + err);
//                 //throw new Error('error in executing3queries');
//                 return callback(new Error('error in executing3queries'), null);
//                 //return callback(null, false);

//                 //return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//             }

//             console.log("Transaction started");

//             db.query(query1, function (error, results1, fields) {
//                 if (error) {


//                     console.log('Error in first query', error);
//                     logException('' + error);

//                     if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
//                         var mytimestamp = new Date();
//                         console.error('Duplicate entry detected. Aborting transaction.'+mytimestamp);
//                         logException('Duplicate entry detected. Aborting transaction.');
//                         return callback(null, null);
//                         // return db.rollback(function () {
//                         //     console.error('Rollback due to duplicate entry in first query');
//                         // });
//                     }

//                     return db.rollback(function () {
//                         console.error('Rollback due to first query error');

//                         //return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//                         //throw new Error('error in executing3queries');
//                         return callback(new Error('error in executing3queries'), null);


//                         //return callback(null, false);
//                     }); 
//                 }

//                 db.query(query2, function (error, results2, fields) {
//                     if (error) {

//                         console.log('Error in second query', error);
//                         logException('' + error);

//                         if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
//                             console.error('Duplicate entry detected. Aborting transaction.');
//                             logException('Duplicate entry detected. Aborting transaction.');
//                             return callback(null, null);
//                             // return db.rollback(function () {
//                             //     console.error('Rollback due to duplicate entry in second query');
//                             // });
//                         }

//                         return db.rollback(function () {
//                             console.error('Rollback due to second query error');

//                             //throw new Error('error in executing3queries');
//                             return callback(new Error('error in executing3queries'), null);
//                             //return callback(null, false);
//                             //return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//                         }); 
//                     }

//                     db.query(query3, function (error, results3, fields) {
//                         if (error) {

//                             flag = false;
//                             console.log('Error in third query', error);
//                             logException('' + error);

//                             if (error.code === 'ER_DUP_ENTRY' || error.code === 1062) {
//                                 console.error('Duplicate entry detected. Aborting transaction.');
//                                 logException('Duplicate entry detected. Aborting transaction.');
//                                 return callback(null, null);
//                                 // return db.rollback(function () {
//                                 //     console.error('Rollback due to duplicate entry in third query');
//                                 // });
//                             }

//                             return db.rollback(function () {
//                                 console.error('Rollback due to third query error');

//                                 //throw new Error('error in executing3queries');
//                                 return callback(new Error('error in executing3queries'), null);
//                                 //return callback(null, false);
//                                 //return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//                             }); 
//                         }

//                         db.commit(function (err) {
//                             if (err) {


//                                 console.log('Error in commit', err);
//                                 logException('' + err);
//                                 return db.rollback(function () {
//                                     console.error('Rollback due to commit error');

//                                     return callback(new Error('error in executing3queries'), null);

//                                     //throw new Error('error in executing3queries');
//                                     //return callback(null, false);
//                                    // return setTimeout(() => executeThreeQueries(query1, query2, query3, numero, callback), 5000);
//                                 });
//                             }

//                             const timestampEnd = new Date();
//                             const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
//                             logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

//                             console.log('All three queries were successful!');
//                             // Do not end the connection here, as it's managed by the singleton

//                             return callback(null, [results1, results2, results3]);
//                         });


//                     });
//                 });
//             });
//         });
//     });
// }






// function executeTwoQueries(query1, query2, callback) {

//     console.log("inside insert recette 4");
//     const db = mysql.createConnection({
//         host: dbParamsMysql['host'],
//         user: dbParamsMysql['user'],is
//         password: dbParamsMysql['password'],
//         database: dbParamsMysql['database']
//     });

//     db.connect(function (err) {
//         if (err) {
//             console.error('Error connecting to the database', err);
//             logException(err);
//             db.end();
//             return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
//         }

//         db.beginTransaction(function (err) {
//             if (err) {
//                 console.log('Error in transaction', err);
//                 logException(err);
//                 db.end();
//                 return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
//             }

//             db.query(query1, function (error, results, fields) {
//                 if (error) {
//                     return db.rollback(function () {
//                         console.log('Error in first query', error);
//                         logException(error);
//                         db.end();
//                         return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
//                     });
//                 }

//                 db.query(query2, function (error, results, fields) {
//                     if (error) {
//                         return db.rollback(function () {
//                             console.log('Error in second query', error);
//                             logException(error);
//                             db.end();
//                             return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
//                         });
//                     }

//                     db.commit(function (err) {
//                         if (err) {
//                             return db.rollback(function () {
//                                 console.log('Error in commit', err);
//                                 logException(err);
//                                 db.end();
//                                 return setTimeout(() => executeTwoQueries(query1, query2, callback), 5000);
//                             });
//                         }
//                         console.log('Both queries were successful!');
//                         db.end();
//                         return callback(null, results);
//                     });
//                 });
//             });
//         });
//     });
// }



