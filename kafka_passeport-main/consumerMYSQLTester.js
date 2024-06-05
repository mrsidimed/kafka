
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
var occupiedFlag = false;
  
var recettes = []; // Array to hold all recettes

let listOfNumbers = [ 1,2,3,4,1];

for (let i of listOfNumbers) {
//for (var i = 0; i < 2; i++) {
    var recette = {}; // Create a new recette object

    console.log("---------------------------------------------------------------------");

    recette['ordreRecette'] = {
        'numero': '060401511120007' , // Example modification to make numbers unique
        'montant': 3000 // Same amount for simplicity, you could randomize this if needed
    };

    recette['reference'] = 'myreference' + i;
    recette['serviceBancaire'] = 'myserviceBancaire' + i;
    recette['datePaiement'] = '2020-04-17'; // Same date for simplicity
    recette['numeroTelephone'] = '3605586' + i; // Minor change for uniqueness
    recette['quittanceB64'] = 'base64Image'; // Same for all, replace as needed

    recette['quittance'] = {
        'quittanceNo': '' + i // Increment to ensure uniqueness
    };

    recette['idTransaction'] = 'myidTransaction' + i;

    recettes.push(recette); // Add the recette object to the array
}


recettes.forEach(recette => {

    runProducer(recette);
})

    
    

function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
 

async function runProducer(ordre) {
    

       
        const producer = kafka.producer();
    try {
        
        //  console.log("Connecting.....")
        await producer.connect()
        console.log("--------------------- connected ");
        
        //   console.log("Connected!")
        //A-M 0 , N-Z 1 
        //  const partition = msg[0] < "N" ? 0 : 1;
        const result = await producer.send({
            //  "topic": "topic2"  kafkaParams["topicConsumer"][],
            "topic": kafkaParams["topicConsumer"],
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
                console.log('sent data === ');

                console.log(ordre);
                 

 

            }

        })
            .catch(err => {

                
                
                logException(err);
              


            });


        await producer.disconnect();
    


    }
    catch (ex) {

        logException(ex);
        console.log("--------------------- disconnected ");
        //occupiedFlag = true;
      
        console.error(`Something bad happened ${ex}`)
    }


}

function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}
