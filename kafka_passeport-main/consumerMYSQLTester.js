
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

let listOfNumbersBefore = [1];
let valueToAdd = 1400;

let listOfNumbers = listOfNumbersBefore.map(number => number + valueToAdd);




//listOfNumbers[0] = getRandomNumberBetween(0,100000);

for (let i of listOfNumbers) {
    //for (var i = 0; i < 2; i++) {
    var recette = { "createdAt": "2024-10-09T10:56:49.856564",
        "datePaiement": "2024-10-09T10:56:50.546273",
         "id": 1331320, 
         "idTransaction": "0424100910564681223",
          "isConsumed": null,
           "numeroQuittance": null,
            "numeroTelephone": "36055868",
             "ordreRecette": { "cacAr": "هويتي",
                "cacFr": "Houwiyeti", 
                "createdAt": "2024-10-09T10:56:24.795913",
                 "dateGeneration": "2024-10-09T10:56:24.795786",
                  "dateNaissance": "1990-12-31T00:00:00.000Z", 
                  "id": 1331300, 
                  "lieuNaissanceAr": "????", 
                  "lieuNaissanceFr": "Atar", 
                  "montant": 20,
                   "nni": "4949612793",
                    "nomFamilleAr": "???????", 
                    "nomFamilleFr": "Lahwerthi",
                     "numero": "900091468210833",
                      "prenomAr": "??? ????", 
                      "prenomFr": "Sidi Mohamed",
                       "typeDemande": "Première demande",
                        "typeDocument": "15-Extrait de Diplôme",
                         "updatedAt": "2024-10-09T10:56:24.795914" },



                           "quittance": { "amount": 20, "createdAt": "2024-10-09T10:56:49.955593", "deliveredBy": null, "id": 1331321, "info1": "Sidi Mohamed Lahwerthi", "info2": "4949612793", "info3": "36055868", "isConsumed": null, "nature": null, "paymentMode": null, "pdfId": "2a52e0e6-795d-4881-b5c6-5b1d9c36ecc1", "quittanceNo": "2024T00002198142", "quittanceOwner": null, "quittanceType": "9-Extrait" }, "quittanceB64": null, "reference": "677da33c-87a8-4b0d-a168-0ee405fb8d5a", "serviceBancaire": "BANKILY", "status": "finished", "updatedAt": "2024-10-09T10:56:49.955805" }; // Create a new recette object

    console.log("---------------------------------------------------------------------");

    recette['ordreRecette']['numero'] = '060401511120007' ;

    recette['ordreRecette']['nni'] = '4949612793';

    recette['reference'] = 'myreference' + i;
    recette['serviceBancaire'] = 'myserviceBancaire' + i;
    //recette['datePaiement'] = '2020-04-17'; // Same date for simplicity
    // recette['numeroTelephone'] = '3605586' + i; // Minor change for uniqueness
    recette['quittanceB64'] = 'base64Image'; // Same for all, replace as needed

    recette['quittance'] = {
        'quittanceNo': '' + i // Increment to ensure uniqueness
    };

    //recette['idTransaction'] = 'myidTransaction' + i;

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
