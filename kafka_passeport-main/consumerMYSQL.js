


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


logException('the app consumerMYSQL.js has started');
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


//const consumer = kafka.consumer({ "groupId": kafkaParams["consumerGroupId"] }) 

const consumer = kafka.consumer({
    groupId: kafkaParams["consumerGroupId"],
    // keep heartbeats frequent relative to session timeout
    sessionTimeout: 60000,        // 60s
    heartbeatInterval: 20000,     // <= 1/3 of sessionTimeout
    // optional: give rebalances enough time if inserts are slow
    rebalanceTimeout: 90000
  })


const { HEARTBEAT, REBALANCING, STABLE, CRASH } = consumer.events;
consumer.on(HEARTBEAT, e => console.log('heartbeat', e.timestamp));
consumer.on(REBALANCING, e => console.log('rebalancing', e.groupId));
//consumer.on(STABLE, e => console.log('stable', e.groupId));
// consumer.on(CRASH, e => {
//     console.error('crash', e.payload && e.payload.error)
//     logException('crash '+e.payload +' --- '+ e.payload.error);

// });


consumer.on(CRASH, e => {
    console.error('CRASH', e.payload.error);
    console.error('restart?', e.payload.restart); // true => KafkaJS will try to restart; false => non-retriable
    logException(`crash ${e.payload} --- ${e.payload.error}`);
    process.exit(1);
  });

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

          let myOrdreRecetteNumero = data['ordreRecette']['numero']?.replace(/^ANR/, '');
             

            console.log('-----------------------------------------------myOrdreRecetteNumero', myOrdreRecetteNumero);
            let codecac, typedoc, transport = 0;

            typedoc = data['ordreRecette']['typeDocument'].split("-")[0];

            if (myOrdreRecetteNumero.startsWith('8')) {

                codecac = '800000';
                //  typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0

            } else if (myOrdreRecetteNumero.startsWith('9')) {
                codecac = '900000';
                //   typedoc = parseInt(ordreRecetteNumero.charAt(4));  // 5th character, as indices start from 0
            } else {
                codecac = myOrdreRecetteNumero.slice(0, 6); // First 6 characters
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
             

            console.log('---------------------------------------------->>>>>>>>>>>>>>-data[ordreRecette][numero]', data['ordreRecette']['numero']);
            console.log('data[ordreRecette][numero]', data['ordreRecette']['numero']);
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




async function runConsumer() {
    try {
      console.log("Connecting.....");
      await consumer.connect();
      console.log("Connected!");
  
      await consumer.subscribe({
        topic: kafkaParams["topicConsumer"],
        fromBeginning: false, // important in prod
      });
  
      console.log("waiting for recettes ===========");
  
      const util = require('util');
      const insertIntoRecettesAsync = util.promisify(insertIntoRecettes);
  
      await consumer.run({
        autoCommit: false,
        eachBatchAutoResolve: false,
        partitionsConsumedConcurrently: 1,
  
        eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
          // Helper to commit NEXT offset for a given message
          const commitNextOffset = async (msg) => {
            try {
              await consumer.commitOffsets([{
                topic: batch.topic,
                partition: batch.partition,
                offset: (BigInt(msg.offset) + 1n).toString(),
              }]);
            } catch (e) {
              // If commit fails, DO NOT throw here; let the loop continue and
              // KafkaJS will retry or we will reprocess on restart.
              console.warn('Commit failed (will likely reprocess on restart):', e.message || e);
              logException('Commit failed (will likely reprocess on restart):', e.message || e) ;
            }
          };
  
          for (const message of batch.messages) {
            const startTs = new Date();
  
            if (!isRunning() || isStale()) break;



                  // ---- SIMULATED CRASH START
        // e.g. send a message whose value is "CRASH_ME" to trigger
        // const raw = message.value?.toString() ?? "";
        // if (true) {
        //     throw new Error("Simulated fatal processing error");
        // }
        // ---- SIMULATED CRASH END
  
            // 1) Parse payload
            let recette , paiement;

            try {

            
              
              
              const message_string = message.value.toString();

              
              input = JSON.parse(message_string);;
              input['quittanceB64'] = null;
              logInput(JSON.stringify(input));

           


              recette = renameOrdreRecetteFields( JSON.parse(message_string));  


               

              



              recette = checkMissingFields(recette);
   
              recette = await addRemainingFields(recette);
              

              
              console.log('apres');
             
              paiement = JSON.parse(message_string);;
              paiement['quittanceB64'] = null;

            


            } catch (e) {

              logException(`Bad JSON, skipping and committing past it:`, e.message || e) ;
              console.error('Bad JSON, skipping and committing past it:', e.message || e);
              // mark resolved for runner bookkeeping
              resolveOffset(message.offset);
              // commit past this bad record so it won't reappear
              await commitNextOffset(message);
              await heartbeat();
              continue;
            }
  
            // 2) Process with bounded retries + heartbeats
            let processed = false;
            const maxAttempts = 6; // ~2m worst case with backoff below
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {

                if(recette.status && recette.status === 'PAID' && !recette.error){

                    await insertIntoRecettesAsync(recette);
                }


                
                processed = true;
                break;
              } catch (err) {
                // store raw payload so nothing is lost
                try {
                  if (recette.idTransaction) {
                    saveDataDuringException(JSON.stringify(recette), recette.idTransaction);
                  }
                } catch {}
  
                console.warn(`Insert failed (attempt ${attempt}/${maxAttempts}):`, err.message || err);
                logException(`Insert failed (attempt ${attempt}/${maxAttempts}):`, err.message || err) ;
                
  
                if (attempt === maxAttempts) {
                  // Give up for now — DO NOT COMMIT this message.
                  // It will be redelivered later (at-least-once).
                  break;
                }
  
                // Backoff while keeping the session alive
                const delayMs = Math.min(2000 * attempt, 15000);
                const deadline = Date.now() + delayMs;
                while (Date.now() < deadline) {
                  await heartbeat();
                  await new Promise(r => setTimeout(r, 500));
                }
              }
            }
  
            // 3) Commit only if processed (or intentionally skipped malformed JSON above)
            if (processed) {

              
              // tell the runner we’re done with this offset
              resolveOffset(message.offset);

              if(!recette.error){
                logPaiement(JSON.stringify(paiement));
                 
              }else{
                

               

                input.error = recette.error;
                input.errorMessage =  recette.errorMessage;
                logUntreatedOrder(JSON.stringify(input));
                 
                 
              }

              
              // commit the *next* offset so this record won't be replayed
              await commitNextOffset(message);
              await heartbeat();
  
              const endTs = new Date();
              const diffSec = (endTs - startTs) / 1000;
              try {
                logTimestampBeforeAndAfterInsertion(
                  startTs.toISOString(),
                  endTs.toISOString(),
                  diffSec,
                  recette.ordreRecette.numero
                );
              } catch {}
            } else {
              // Not processed (e.g., DB down or poison that we want to retry later):
              // DO NOT resolve/commit; exit the loop early to avoid burning CPU.
              // Kafka will redeliver from this offset later.
              break;
            }
          }
        },
      });
  
    } catch (ex) {
      logException(ex);
      // Do NOT call runConsumer() recursively. Let KafkaJS handle reconnects/rebalances.
    }
  }




 
  


 

function addRemainingFields(recette) {
    return new Promise((resolve, reject) => {
      mySingletonConnection.getConnection(function (err, con) {
        if (err) {
          return reject(new Error('Failed to get DB connection: ' + err.message));
        }
  
        try {
          const ordreRecetteNumero = recette.ordreRecette.numero;

          
          
          const queryOrdre = "SELECT ordres.NUMERO, ordres.NNI, ordres.TYPEDOC FROM ordres WHERE NUMERO = '" + ordreRecetteNumero + "'";
  
          con.query(queryOrdre, function (err, ordreResults) {
            if (err) {
              return reject(err);
            }
  
            console.log('ordreResults', ordreResults);

            if (ordreResults.length > 0) {
              recette.ordreRecette.nni = ordreResults[0].NNI;
              recette.ordreRecette.typeDocument = ordreResults[0].TYPEDOC + '-doc';
            }else{

              recette.error = true;
              recette.errorMessage = 'Ordre non existant dans la base de données';
            }

         

            resolve(recette);
          });
          
        } catch (error) {
          logException(error);
          reject(error);
        }
      });
    });
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
// neziha , youssef 


function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' consumerMYSQL: ' + error + '\n\n');

}

function toMysqlDatetime(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}



function checkMissingFields(data) {
  


  const requiredFields = [
    ['data.ordreRecette.montant', data?.ordreRecette?.montant],
    ['data.ordreRecette.numero', data?.ordreRecette?.numero],
    
    ['data.datePaiement', data?.datePaiement],
    ['data.reference', data?.reference],
    ['data.serviceBancaire', data?.serviceBancaire],
    ['data.idTransaction', data?.idTransaction],

    ['data.status', data?.status],

    ['data.quittanceB64', data?.quittanceB64],
    
   

    ['data.quittance.quittanceNo', data?.quittance?.quittanceNo],
    
];

const missingFields = requiredFields
    .filter(([, value]) => value === undefined || value === null)
    .map(([fieldName]) => fieldName);


 
if (missingFields.length > 0) {
    data.error = true;
    data.errorMessage = 'missing fields : ' + missingFields.join(' , ');
}

 
 
  return data;
}

function renameOrdreRecetteFields(data) {
  const newData = {
    ordreRecette: {
      numero: data.receiptOrderNumber,
      montant: data.amount,
    },
    idTransaction: data.bankTransactionId,
    quittance: {
      quittanceNo: data.quittanceNumber
    },
    



    datePaiement: data.paymentDate != null
      ? data.paymentDate
      : (data.timestamp != null ? data.timestamp : toMysqlDatetime(new Date().toISOString()) ),

    serviceBancaire: 'Not provided',
    numeroTelephone: null,
    ...data
  };

  // Check the NEW data you just created, not the original data
  // if (typeof newData.ordreRecette.numero === "string") {
  //   newData.ordreRecette.numero = newData.ordreRecette.numero.replace(/^ANR/, "");
  // }

  // Clean up old field names
  delete newData.receiptOrderNumber;
  delete newData.amount;
  delete newData.bankTransactionId;
  delete newData.transactionReference;
  delete newData.quittanceNumber;
  delete newData.timestamp;

  return newData;
}

function renameOrdreRecetteFields_old_10_08_2026(data) {
    const newData = {
      ordreRecette: {
        numero: data.receiptOrderNumber,
        montant: data.amount,
      },
      idTransaction: data.bankTransactionId,
      quittance: {
        quittanceNo: data.quittanceNumber
      },
      datePaiement: data.paymentDate,
      serviceBancaire: 'Not provided',
      numeroTelephone: null,
      ...data
    };
  
    // Check the NEW data you just created, not the original data
    // if (typeof newData.ordreRecette.numero === "string") {
    //   newData.ordreRecette.numero = newData.ordreRecette.numero.replace(/^ANR/, "");
    // }
  
    // Clean up old field names
    delete newData.receiptOrderNumber;
    delete newData.amount;
    delete newData.bankTransactionId;
    delete newData.transactionReference;
    delete newData.quittanceNumber;  
    delete newData.paymentDate;
  

    
    return newData;
  }

 



function logPaiement(paiement) {

    console.log("inside paiement");
    if (!fs.existsSync('./paiements')) {
        fs.mkdirSync('./paiements');
    }
    fs.appendFileSync('./paiements/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + paiement + '\n\n');

}



function logUntreatedOrder(untreatedOrder) {

  console.log("inside input");
  if (!fs.existsSync('./untreatedOrder')) {
      fs.mkdirSync('./untreatedOrder');
  }
  fs.appendFileSync('./untreatedOrder/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + untreatedOrder + '\n\n');

}


function logInput(input) {

    console.log("inside input");
    if (!fs.existsSync('./input')) {
        fs.mkdirSync('./input');
    }
    fs.appendFileSync('./input/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + input + '\n\n');

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
               // if (typeDoc in ['9', '4', '15']) {
                if (['9','4','15'].includes(typeDoc)){
                    db.commit(function (err4) {
                        if (err4) {
                            console.log('Error in commit', err4);
                            logException('' + err4);
                            return callback(err4, null);

                     
                        }

                        const timestampEnd = new Date();
                        const timeDifference = (timestampEnd - timestampStart) / 1000; // Difference in seconds
                        //logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

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
                   //         logTimestampBeforeAndAfterInsertion(timestampStart.toISOString(), timestampEnd.toISOString(), timeDifference, numero);

                            console.log('All Two queries were successful!---------------------------');

                            console.log('------>myfin ' + quittanceNO);
                            return callback(null, quittanceNO);
                        });

                    });
                }
            });
        });
    });
}

