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
              const recette = JSON.parse(message.value.toString());
              console.log(`📥  Processing recette at ${new Date().toISOString()}`);
              recette['quittanceB64'] = null ;
              console.log(recette);
              console.log();
          
              try {
                await sendRecetteToEndpoint(recette);      // 🚀 your business logic
          
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





/**
 * Send a recette object to the remote HTTP endpoint.
 * Resolves on 2xx, rejects otherwise.
 */
async function sendRecetteToEndpoint(recette) {
    const url = endpointUrl;
    try {
        const res = await axios.post(url, recette, { timeout: 8000 });
        console.log(`🟢  POST ${url} -> ${res.status}`);
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



function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');
  
  }