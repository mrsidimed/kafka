const { Kafka } = require("kafkajs")
const { Client } = require('pg');
const mysql = require('mysql');

//var con = require('./Singleton');
const mySingletonConnection = require('./mySingletonConnection');

//import dbParams from ('./dbParameters.json')


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');

const axios = require('axios');


envVars = require('./environmentVariables.json');




var kafkaParams, endpointUrl;

if (envVars['production']) {

    endpointUrl = envVars['endpointUrlRecetteProd'];
    kafkaParams = require('./kafkaParametersProd.json');

} else {

    endpointUrl = envVars['endpointUrlRecetteLocal'];
    kafkaParams = require('./kafkaParameters.json');

}




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


        var recette = {};

        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            "topic": kafkaParams['topicConsumer'],
            "fromBeginning": true
        })


        // await consumer.run({
        //     "eachMessage": async result => {

        //         console.log('')
        //         console.log('')

        //         recette = JSON.parse(`${result.message.value}`);

        //         console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);

        //         sendRecetteToEndpoint(recette)
        //             .then(() => {
        //                 console.log('✅  Recette forwarded to endpoint');

        //                 logRecette(recette);
        //             })
        //             .catch(err => {
        //                 logException(err + ' ; during HTTP forward of recette[' + recette.idTransaction + ']');
        //                 // Same fallback you already use when DB ops fail
        //                 saveDataDuringException(JSON.stringify(recette), recette.idTransaction || Date.now());
        //             });
        //     }
        // })



        await consumer.run({
            autoCommit: false,                // <-- you decide when to commit
            eachMessage: async ({
              topic, partition, message
            }) => {

              const unchangedRecette = JSON.parse(message.value.toString()); 
              unchangedRecette.quittanceB64 = 'null';
              logInput(unchangedRecette);


              const recette = renameOrdreRecetteFields( JSON.parse(message.value.toString()));
              console.log(`📥  Processing recette at ${new Date().toISOString()}`);
            
              
            //  recette.quittanceB64 = 'null';
         
            //  console.log(recette);
              console.log();
          
              try {

                if (recette.status && recette.status === 'PAID') {
                    await sendRecetteToEndpoint(recette);      // 🚀 your business logic
                }else{
                    console.log('recette not paid');
                }

                
          
                // ✔ HTTP succeeded – mark the record as processed
                await consumer.commitOffsets([
                  {
                    topic,
                    partition,
                    // commit the *next* offset → current + 1
                    offset: (Number(message.offset) + 1).toString()
                  }
                ]);
                console.log('✅ committed offset', message.offset);

                recette.quittanceB64 = 'null';
                logRecette(recette);
            
              } catch (err) {
                // ❌ Endpoint unavailable – *do not* commit
                console.error('🔴  forward failed, will retry:', err.message);
 
                throw err;   // at-least-once semantics
              }
            }
          });
          

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
        // console.error(`Something bad happened ${ex}`)
    }
    finally {

    }


}




data= {
    
    "receiptOrderNumber":"ANR652486",
    "reference":"450752868537",
    "transactionReference":"410a0a92-9f37-489e-8d19-045098667b3f",
    "bankTransactionId":"96b69890-3cc7-44f5-998e-df0f791cfc87",
    "status":"SUCCEEDED",
    "amount":6700,
    "quittanceNumber":"410a0a92-9f37-489e-8d19-045098667b3f",
    "quittanceUrl":"https://backup-api.prd-envs.adias.fr/soget-files//quittance/pdf/1c052d99840449799fad97457b2c7b1f_quittance_DGI-2026T000020000141.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260629T153247Z&X-Amz-SignedHeaders=host&X-Amz-Credential=ZEKUJ4V6Z4qeNQFc%2F20260629%2Fadias%2Fs3%2Faws4_request&X-Amz-Expires=600&X-Amz-Signature=e6c7b3237ee0f6ab2233981a18928c39b476a52794d3eec4915763c936d38243",

    "quittanceB64":null,
    "eventType":"quittance.generated",
    "timestamp":"2026-06-29T15:32:48.283646518"
}



function renameOrdreRecetteFields(data) {

    var  receiptOrderNumber = data.receiptOrderNumber;
    delete data.receiptOrderNumber;
  

    // if (typeof receiptOrderNumber === "string") { // if  receiptOrderNumber starts with 'ANR' delete it
    //     receiptOrderNumber = receiptOrderNumber.replace(/^ANR/, "");
    // }

    data.ordreRecette = {numero: receiptOrderNumber};
    
    data.numeroOrdreRecette =  receiptOrderNumber;

 
    data.serviceBancaire = "Not provided";

    data.idTransaction = data.transactionReference;
    delete data.transactionReference;

    // Create quittance object if it doesn't exist
    if (!data.quittance) {
      data.quittance = {};
    }
    data.quittance.quittanceNo = data.quittanceNumber;
    delete data.quittanceNumber;

    data.numeroTelephone = "Not provided";
   
    data.datePaiement = data.paymentDate;
    delete data.paymentDate;
    
    return data;
}
 
/**
 * Send a recette object to the remote HTTP endpoint.
 * Resolves on 2xx, rejects otherwise.
 */
async function sendRecetteToEndpoint(recette) {
    const url = endpointUrl;
    try {
        const res = await axios.post(url, recette, { timeout: 8000 });
        console.log(`🟢  POST ${url} -> ${res.status}`);
        console.log(recette);
    } catch (err) {
        logException(`POST ${url} failed: ${err.message}`);
        // Re-throw so caller can handle like old DB errors
        throw new Error(`POST ${url} failed: ${err.message}`);
        
    }
}



function logRecette(recette) {

    console.log("inside recette");
    if (!fs.existsSync('./recettes')) {
        fs.mkdirSync('./recettes');
    }
    fs.appendFileSync('./recettes/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + JSON.stringify(recette) + '\n\n');

}


function logInput(input) {

    console.log("inside input");
    if (!fs.existsSync('./input')) {
        fs.mkdirSync('./input');
    }
    fs.appendFileSync('./input/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + JSON.stringify(input) + '\n\n');

}



function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');
  
  }
