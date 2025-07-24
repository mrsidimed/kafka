


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


    mySingletonConnection.getConnection(function (err, con) {

        if (err) {
            logException(err);
            callback(err, null);
            //throw new Error(`insert of order number :  ${data['ordreRecette']['numero']} failed: ${err.message}`);

        } else {

            let ordreRecetteNumero = data['ordreRecette']['numero'];
            let codecac, typedoc, transport = 0;

            typedoc = data['ordreRecette']['typeDocument'].split("-")[0];

            if (ordreRecetteNumero.startsWith('8')) {

                codecac = '800000';
                //  typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0

            } else if (ordreRecetteNumero.startsWith('9')) {
                codecac = '900000';
                //   typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0
            } else {
                codecac = ordreRecetteNumero.slice(0, 6); // First 6 characters
                //typedoc = parseInt(ordreRecetteNumero.charAt(6));   // 7th character
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
            } else if (typedoc == 15) {
                Nature_encaiss = 'EXTRD';
            }


            var mynewdate = formatDate(new Date());


            console.log("mynewdate " + mynewdate);
            var queryInsertPdf2 = "Insert Into  recettes_pdf(   Quittance ,quittance_pdf ) " +
                "VALUES (    '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['quittanceB64'] + "' )";
            var queryInsertion = "Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone , nni ) " +
                "VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + transport + " ," + data['ordreRecette']['montant'] + ", '" + codecac + "' , 'Reçue', '" + mynewdate + "' , '" + data['ordreRecette']['numero'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "'  , '" + data['ordreRecette']['nni'] + "'  )";
            var queryUpdateAcquite = "UPDATE ordres SET acquite = 1, Nrecette = 'PE' where NUMERO = '" + data['ordreRecette']['numero'] + "'";


            //executeThreeQueries(queryInsertion, queryInsertPdf2, queryUpdateAcquite, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], function (err, results) {
            executeTwoQueries(queryInsertion, queryInsertPdf2, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], function (err, results) {
                console.log("inside insert recette 5");


                // if (err == null && results == null) {

                //     console.log('data not inserted because');
                //     callback(null, null);
                // } else 



                if (err != null && results == null) {

                    console.log('An error occurred: ', err);
                    logException(err);
                    callback(err, null);
                    console.log('An error occurred: ', err);
                    //throw new Error(`insert of order number :  ${data['ordreRecette']['numero']} failed: ${err.message}`);

                    //logException(data['ordreRecette']['numero'] + " is beeing reinserted reinserted ");
                    //console.log(data['ordreRecette']['numero'] + " is beeing reinserted reinserted ");
                    //return setTimeout(() => executeThreeQueries(queryInsertion, queryInsertPdf2, queryUpdateAcquite, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], callback), 5000);
                    //return setTimeout(() => executeTwoQueries(queryInsertion, queryInsertPdf2, data['ordreRecette']['numero'], typedoc, data['quittance']['quittanceNo'], callback), 5000);


                } else {
                    console.log('Queries executed successfully: ');
                    callback(null, results);
                }
            });


        }
    })



}



function insertIntoRecettesOLD(data, callback) {


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

                    typedoc = data['ordreRecette']['typeDocument'].split("-")[0];

                    if (ordreRecetteNumero.startsWith('8')) {

                        codecac = '800000';
                        //  typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0

                    } else if (ordreRecetteNumero.startsWith('9')) {
                        codecac = '900000';
                        //   typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0
                    } else {
                        codecac = ordreRecetteNumero.slice(0, 6); // First 6 characters
                        //typedoc = parseInt(ordreRecetteNumero.charAt(6));   // 7th character
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
                    } else if (typedoc == 15) {
                        Nature_encaiss = 'EXTRD';
                    }


                    var mynewdate = formatDate(new Date());



                    console.log("mynewdate " + mynewdate);
                    var queryInsertPdf2 = "Insert Into  recettes_pdf(   Quittance ,quittance_pdf ) " +
                        "VALUES (    '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['quittanceB64'] + "' )";
                    var queryInsertion = "Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone , nni ) " +
                        "VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + transport + " ," + data['ordreRecette']['montant'] + ", '" + codecac + "' , 'Reçue', '" + mynewdate + "' , '" + data['ordreRecette']['numero'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "'  , '" + data['ordreRecette']['nni'] + "'  )";
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

        // await consumer.run({

        function insertWithRetry(recette, paiement, topic, partition, message) {
            insertIntoRecettesAsync(recette, async function (err, result) {
                if (err) {
                    console.log('it has not worked, insert of recertte of quittanceNo : ' + paiement['quittance']['quittanceNo']);
                    logException('it has not worked, insert of recertte of quittanceNo : ' + paiement['quittance']['quittanceNo']);

                    setTimeout(() => {
                        insertWithRetry(recette, paiement, topic, partition, message);
                    }, 2000); // 2 seconds delay

                } else {
                    console.log('it has worked =================');
                    logPaiement(JSON.stringify(paiement));
                    await consumer.commitOffsets([
                        {
                            topic,
                            partition,
                            offset: (Number(message.offset) + 1).toString()
                        }
                    ]);
                }
            });
        }


        await consumer.run({
            autoCommit: false,                // <-- you decide when to commit
            eachMessage: async ({
                topic, partition, message
            }) => {


                //  "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
                console.log('')
                console.log('')

                recette = JSON.parse(message.value.toString());
                paiement = JSON.parse(message.value.toString());

                //console.log(recette)
                paiement['quittanceB64'] = null;


                console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);


                // Get the quittanceNo
                let quittanceNo = recette['quittance']['quittanceNo'];


                let success = false;
                while (!success) {
                    try {
                        await insertIntoRecettesAsync(recette); // must return a Promise
                        logPaiement(JSON.stringify(paiement));
                        await consumer.commitOffsets([
                            {
                                topic,
                                partition,
                                offset: (Number(message.offset) + 1).toString()
                            }
                        ]);
                        success = true; // exit loop
                    } catch (err) {
                        logException('Insert failed, will retry: ' + err);
                        // Wait before retrying
                        await new Promise(res => setTimeout(res, 2000));
                    }
                }

                try {


                } catch (err) {
                    // ❌ Endpoint unavailable – *do not* commit
                    console.error('🔴  forward failed, will retry:', err.message);

                    throw err;   // at-least-once semantics
                }

            }
        });


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


function logTimestampBeforeAndAfterInsertion(timestampBefore, timestampAfter, timeDifference, numeroOrdre) {

    console.log('timeDiffSeconds: ' + timeDifference + ',          timestampBefore: ' + timestampBefore + ',       timestampAfter  : ' + timestampAfter + ',         numeroOrdre: ' + numeroOrdre + ' \n\n')
    if (!fs.existsSync('./logsInsertion')) {
        fs.mkdirSync('./logsInsertion');
    }
    fs.appendFileSync('./logsInsertion/' + new Date().toISOString().split('T')[0], 'timeDiffSeconds: ' + timeDifference + ',          timestampBefore: ' + timestampBefore + ',       timestampAfter  : ' + timestampAfter + ',         numeroOrdre: ' + numeroOrdre + ' \n\n');

}




function executeTwoQueries(query1, query2, numero, typeDoc, quittanceNO, callback) {
    console.log("inside executeTwoQueries");


    const timestampStart = new Date();

    mySingletonConnection.getConnection((err1, db) => {
        if (err1) {
            console.error('Error connecting to the database', err);
            logException('' + err1);
            return callback(err1, null);
        }

        console.log("Database connection established");

        db.beginTransaction(function (err2) {
            if (err2) {
                console.log('Error in transaction', err);
                logException('' + err2);
                return callback(err2, null);
            }

            console.log("Transaction started");

            db.query(query1, function (error3, results1, fields) {
 


                if (error3) {
                    /* Ignore duplicate‑key errors, keep going */
                    if (error3.code === 'ER_DUP_ENTRY' || error3.errno === 1062) {
                        console.warn('Duplicate entry in 1st query – continuing , quittanceNO : ' +quittanceNO );
                        logException('Duplicate entry in 1st query – continuing , quittanceNO : ' +quittanceNO );
                        // do NOT return; pretend it succeeded
                    } else {
                        console.log('Error in first query', error3);
                        logException('' + error3);
                        return callback(error3, null);   // stop on real errors
                    }

                }

                // If typeDoc is 9 4 15, commit after the first query
                if (typeDoc in ['9', '4', '15']) {
                    db.commit(function (err4) {
                        if (err4) {
                            console.log('Error in commit', err4);
                            logException('' + err4);
                            return callback(err4, null);

                     
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
                    db.query(query2, function (error5, results2, fields) {
 

                        if (error5) {
                            /* Ignore duplicate‑key errors, keep going */
                            if (error5.code === 'ER_DUP_ENTRY' || error5.errno === 1062) {
                                console.warn('Duplicate entry in 2nd query – continuing , quittanceNO : ' +quittanceNO );
                                logException('Duplicate entry in 2nd query – continuing , quittanceNO : ' +quittanceNO );
                                // continue straight to commit
                            } else {
                                console.log('Error in second query', error5);
                                logException('' + error5);
                                return callback(error5, null); // stop on real errors
                            }
                        }

                        

                        db.commit(function (err6) {
                            if (err6) {
                                console.log('Error in commit', err6);
                                logException('' + err6);
                                return callback(err6, null);
                     
                            }

                            const timestampEnd = new Date();
                            const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                            logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                            console.log('All Two queries were successful!');

                            console.log('------>myfin ' + quittanceNO);
                            return callback(null, quittanceNO);
                        });

                    });
                }
            });
        });
    });
}

