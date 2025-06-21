
const { Kafka } = require("kafkajs")
const { Client } = require('pg');
const mysql = require('mysql');

//var con = require('./Singleton');
const mySingletonConnection = require('./mySingletonConnection');

//import dbParams from ('./dbParameters.json')


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


envVars = require('./environmentVariables.json');

const axios = require('axios');




var dbParams, kafkaParams , endpointUrl;


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

    endpointUrl = envVars['endpointUrlOrdreProd'];
    kafkaParams = require('./kafkaParametersProd.json');

} else {
 
    endpointUrl = envVars['endpointUrlOrdreLocal'];
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

// const consumer = kafka.consumer({ "groupId": kafkaParams['consumerGroupId'] })

// runConsumer();

// const { DISCONNECT } = consumer.events
// const removeListener = consumer.on(DISCONNECT, e => {

//     console.log(`------------------DISCONNECT at ${e.timestamp}`);
//     runConsumer();
// });

 

// async function runConsumer() {
//     try {


//         var recette = {};


//         console.log("Connecting.....")
//         await consumer.connect()
//         console.log("Connected!")

//         await consumer.subscribe({
//             "topic": kafkaParams['topicConsumer'],
//             "fromBeginning": true
//         })




//         await consumer.run({
//             "eachMessage": async result => {

//                 console.log('')
//                 console.log('')
//                 //console.log(`received data =  ${result.message.value} `);



//                 recette = JSON.parse(`${result.message.value}`);

//                 console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);


//                 /* fs.writeFile('test.txt', JSON.stringify(recette), err => {
//                     if (err) {
//                         console.error(err)
//                         return
//                     }
//                     //file written successfully
//                 }); */




//                 sendRecetteToEndpoint(recette)
//                     .then(() => {
//                         console.log('✅  Recette forwarded to endpoint');
//                     })
//                     .catch(err => {
//                         logException(err + ' ; during HTTP forward of recette[' + recette.idTransaction + ']');
//                         // Same fallback you already use when DB ops fail
//                         saveDataDuringException(JSON.stringify(recette), recette.idTransaction || Date.now());
//                     });



//             }
//         })

//     }
//     catch (ex) {
//         logException(ex);

//         if (recette['idTransaction']) {
//             saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
//         }

//         var myError = "" + ex;

//         if (myError.includes("KafkaJSNumberOfRetriesExceeded")) {

//             runConsumer();

//         }
//         // console.error(`Something bad happened ${ex}`)
//     }
//     finally {

//     }


// }


// async function sendRecetteToEndpoint(recette) {
//     const url = envVars.endpointUrl;
//     try {
//         const res = await axios.post(url, recette, { timeout: 8000 });
//         console.log(`🟢  POST ${url} -> ${res.status}`);
//     } catch (err) {
//         // Re-throw so caller can handle like old DB errors
//         throw new Error(`POST ${url} failed: ${err.message}`);
//     }
// }


var occupiedFlag = false;
setInterval(() => {




    getOrders();

}
    , 10000);



    async function getOrders(){
        if (!occupiedFlag) {
            occupiedFlag = true;
            
            try {
                const response = await axios.get(envVars.endpointUrl);
                const data = response.data;
                
                if (data && data.length > 0) {
                    console.log(`Received ${data.length} orders from endpoint`);
                    
                    for (const ordre of data) {
                        runProducer(ordre);
                        
                    }
                } else {
                    console.log('No new orders from endpoint');
                }
            } catch (err) {
                logException(err + ' ; error fetching data from endpoint');
            } finally {
                occupiedFlag = false;
            }
        } else {
            console.log("Currently occupied, skipping this cycle");
        }
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
            "topic": kafkaParams['topicProducer'],
            "messages": [
                {
                    "value": JSON.stringify(ordre),
                    "partition": 0
                }
            ]
        }).then(result => {


            if (result[0]['errorCode'] == 0) {

 
                console.log('sent data = ');
                console.log(ordre);
                logOrdre(ordre);

            }

        })
            .catch(err => {
                logException(err);


            });


        await producer.disconnect();


    }
    catch (ex) {
        logException(err);
        console.error(`Something bad happened ${ex}`)
    }


}

function logOrdre(ordre) {

    console.log("inside ordre");
    if (!fs.existsSync('./ordres')) {
        fs.mkdirSync('./ordres');
    }
    fs.appendFileSync('./ordres/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + JSON.stringify(ordre) + '\n\n');

}










