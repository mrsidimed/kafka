
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

 



async function runConsumer() {


    var recette = {};


    try {

 

        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        console.log("kafkaParams['topicConsumer'] =" + kafkaParams["topicConsumer"]);
        await consumer.subscribe({
            //  "topic": "topic1",
            "topic": kafkaParams["topicProducer"],
            "fromBeginning": true
        })

        await consumer.run({

            "eachMessage": async result => {
       

                recette = JSON.parse(`${result.message.value}`);
 
                console.log(recette)


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