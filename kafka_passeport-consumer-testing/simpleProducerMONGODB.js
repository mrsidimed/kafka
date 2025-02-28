
const { Kafka } = require("kafkajs")
const mysql = require('mysql');



envVars = require('./environmentVariables.json');
//var con = require('./Singleton');

const mySingletonConnection = require('./mySingletonConnection');

var dbParams, kafkaParams, intervalDuration, numberOfOrders;



if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mongo/db_params_prod.json');
    kafkaParams = require('./params_kafka/kafkaParametersProd.json');

} else {

    //  recettesFolder = "recettes/"/Users/multimedia/sidiMohamed/workspace/kafka/kafka_passeport-main/
    dbParams = require('./params_project_mongo/db_paramas_dev.json');
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





// biginning




const mongoose = require('mongoose');
const ordersRecettes = require("./models/ordersRecettes");

const DB_USER = dbParams['database']['user'];
const DB_PASSWORD = encodeURIComponent(dbParams['database']['password']); // Ensure password is URL encoded in case of special characters
const DB_NAME = dbParams['database']['name'];
const HOST = dbParams['database']['host'];


// const DB_USER = 'root';
// const DB_PASSWORD = encodeURIComponent('password'); // Ensure password is URL encoded in case of special characters
// const DB_NAME = 'anrpts';
// const HOST = 'localhost:27017';

const MONGODB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${HOST}/${DB_NAME}?authSource=admin`; // Assumes the authentication source is "admin"

intervalHewiyeti = 5000;

// Mongoose connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};



let isUpdating = false;  // <<< Introduced a new flag to track if updateOrderHewiyeti is running



const handleDisconnectHewiyeti = (retryFunction) => {

    if (fetchDataInterval) {
        clearInterval(fetchDataInterval);  // <<< Stop the fetchData interval when disconnect detected during update
    }

    if (isConnectedBefore) {
        console.log('MongoDB connection lost. Reconnecting in 5 seconds...');
        setTimeout(() => {
            connectWithRetry();
            if (typeof retryFunction === 'function') retryFunction();
        }, 5000);
    }
};


const updateOrderHewiyeti = async (numero) => {

    
    isUpdating = true;  // <<< Set the flag indicating that updateOrderHewiyeti is running
    try {
        await ordersRecettes.updateOne({ numero: numero }, { sent: true });
        console.log(`Updated 'sent' field to true for document with numero: ${numero}`);
    } catch (error) {
        //console.error('Error updating data.', error);
        console.error('Error updating data.');
        handleDisconnectHewiyeti(() => updateOrderHewiyeti(numero));  // Passing the function with the id argument
        return;  // <<< Ensure that isUpdating is not prematurely set to false

    }

    isUpdating = false;  // <<< Reset the flag after the update completes

    if (!fetchDataInterval) {
        fetchDataInterval = setInterval(fetchData, intervalHewiyeti);  // <<< Reinitiate the fetchData interval if it was cleared
    }


};


let isConnectedBefore = false;
let fetchDataInterval;

const connectWithRetry = async () => {
    console.log('Attempting to connect to MongoDB...');
    mongoose.connect(MONGODB_URI, options)
        .catch(() => { });  // Catch initial connection errors and handle them with the 'disconnected' event
};

async function connectWithRetryForConsumerUpdate() {
    try {
      await mongoose.connect(MONGODB_URI, options);
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.log('Failed to connect to MongoDB. Retrying in 10 seconds...');
      setTimeout(connectWithRetry, 10000);
    }
  }


const fetchData = async () => {


    if (isUpdating) {  // <<< Check the isUpdating flag
        console.log('Update in progress, skipping fetchData execution.');
        return;
    }


    try {

        // const dataHewiyeti = await ordersRecettes.find({ sent: false }).limit(1);;

        const dataHewiyeti = await ordersRecettes.aggregate([
            {
                $match: { sent: false }
            },
            {
                $lookup: {
                    from: 'personnes',
                    localField: 'nni',
                    foreignField: 'nni',
                    as: 'personneInfo'
                }
            },
            {
                $unwind: '$personneInfo'
            },
            {
                $lookup: {
                    from: 'cacs',
                    localField: 'codeCac',
                    foreignField: 'codeCentre',
                    as: 'cacInfo'
                }
            },
            {
                $unwind: '$cacInfo'
            },
            {
                $project: {
                    _id: 0,
                    numero: 1,
                    nni: 1,
                    prenomFr: '$personneInfo.prenomFr',
                    prenomAr: '$personneInfo.prenomAr',
                    nomFamilleFr: '$personneInfo.patronymeFr',
                    nomFamilleAr: '$personneInfo.patronymeAr',
                    dateNaissance: { $dateToString: { format: "%d/%m/%Y", date: "$personneInfo.dateNaissance" } },
                    lieuNaissanceFr: '$personneInfo.lieuNaissanceFr',
                    lieuNaissanceAr: '$personneInfo.lieuNaissanceAr',
                    montant: 1,
                    typeDemande: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$typeDem", "PR"] }, then: "Première demande" },
                                { case: { $eq: ["$typeDem", "RP"] }, then: "Remplacement" },
                                { case: { $eq: ["$typeDem", "RN"] }, then: "Renouvellement" }
                            ],
                            default: "$typeDem"
                        }
                    },
                    typeDocument: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$typeDoc", "ID"] }, then: "Carte d’identité" },
                                { case: { $eq: ["$typeDoc", "NP"] }, then: "Passport normal" },
                                { case: { $eq: ["$typeDoc", "VP"] }, then: "Passport VIP" },
                                { case: { $eq: ["$typeDoc", "RC"] }, then: "Carte résident" },
                                { case: { $eq: ["$typeDoc", "EX"] }, then: "Extrait" }
                            ],
                            default: "$typeDoc"
                        }
                    },
                    cacFr: '$cacInfo.nomCentreFr',
                    cacAr: '$cacInfo.nomCentreAr',
                }
            },
            {
                $limit: 2
            }
        ])


        if (dataHewiyeti.length > 0) {

            for (var h = 0; h < dataHewiyeti.length; h++) {
                dataHewiyeti[h]['date_generation'] = new Date();
                dataHewiyeti[h]['transport'] = 0;

                runProducerHewiyeti(dataHewiyeti[h]);
            }

        } else {
            console.log('waiting for new orders  From hewiyeti');
        }

    } catch (error) {
        console.error('Error fetching data.', error);
        logException('Error fetching data. ' + error)

        handleDisconnect();  // if fetchData fails, treat it as a disconnect
    }

};

const handleDisconnect = () => {
    if (fetchDataInterval) {
        clearInterval(fetchDataInterval);  // Clear the fetchData interval
    }

    // If we weren't connected before, it means we are already trying to connect,
    // so we don't need to retry again.
    if (!isConnectedBefore) {
        return;
    }

    console.log('MongoDB connection lost. Reconnecting in 5 seconds...');
    setTimeout(connectWithRetry, 10000); // This line was missing in the earlier version.
};

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB ------------------------------------------------------ ');
    isConnectedBefore = true;
    fetchData();
    fetchDataInterval = setInterval(fetchData, intervalHewiyeti);  // Fetch data every 5 seconds
});

mongoose.connection.on('disconnected', handleDisconnect);

mongoose.connection.on('error', err => {
    //console.error('Mongoose default connection error:', err);
    logException('Mongoose default connection error: ' + err)

    handleDisconnect();  // Added this line to handle unexpected errors by trying to reconnect
});

connectWithRetry();



//END


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


async function runProducerHewiyeti(ordre) {
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
                console.log('sent data  Hewiyeti= ');
                console.log(ordre);

                updateOrderHewiyeti(ordre['numero']);

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













function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function runConsumer() {



    try {

        var recette = {};
        // //start of a test

        console.log("-------==========");


        data['numeroOrdreRecette'] = '060401511120007';



        recette['ordreRecette'] = {
            'numero': '060401511120007'
        }
        recette['reference'] = 'myreference';
        recette['serviceBancaire'] = 'myserviceBancaire';
        recette['idTransaction'] = 'myidTransaction' + getRandomNumberBetween(0, 1000000);
        recette['datePaiement'] = '2020-04-17';
        //data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

        recette['quittance'] = {
            'quittanceNo': '' + getRandomNumberBetween(0, 1000000)
        }
        recette['numeroTelephone'] = '36055868';
        recette['quittanceB64'] = 'base64Image';


        numero = recette['ordreRecette']['numero'];

        updateOrderRecettesByNumero(numero, recette);


 


        // //end of a test



        // console.log("Connecting.....")
        // await consumer.connect()
        // console.log("Connected!")

        // console.log("kafkaParams['topicConsumer'] =" + kafkaParams["topicConsumer"]);
        // await consumer.subscribe({
        //     //  "topic": "topic1",
        //     "topic": kafkaParams["topicConsumer"],
        //     "fromBeginning": true
        // })


        //test start





        //test end


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
                numero = recette['ordreRecette']['numero'];

                updateOrderRecettesByNumero(numero, recette);
            
 
                



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


// data['ordreRecette'] = {
//     'numero': '060401511120007'
    
// }
// data['reference'] = 'myreference';
// data['serviceBancaire'] = 'myserviceBancaire';
// data['idTransaction'] = 'myidTransaction';
// data['datePaiement'] = '2020-04-17';
// //data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

// data['quittance'] = {
//     'quittanceNo': ''+getRandomNumberBetween(0,1000000)
// }
// data['numeroTelephone'] = '36055868';
// data['quittanceB64'] = 'base64Image';

async function updateOrderRecettesByNumero(numero, updateData) {
    // if (isUpdating) {
    //   console.log('An update is already in progress. Please wait...');
    //   return;
    // }
  
   // isUpdating = true;
  
   console.log("sleep 15s");
   //sleep(15000);
   


    try {
      await mongoose.connect(MONGODB_URI, options); // Ensure the connection is open
      const updatedOrder = await ordersRecettes.findOneAndUpdate(
        { numero: numero },
        {
          $set: {
            reference: updateData.reference,
            serviceBancaire: updateData.serviceBancaire,
            idTransaction: updateData.idTransaction,
            datePaiement: updateData.datePaiement,
            numeroQuittance: updateData.quittance.numeroQuittance,
            numeroTelephone: updateData.numeroTelephone,
            quittanceB64: updateData.quittanceB64,
            acquite: true,
          },
        },
        { new: true }
      );
  
      if (updatedOrder) {
        console.log('Order updated successfully:', updatedOrder);
      } else {
        console.log('Order not found');
      }
    } catch (error) {
      console.error('Error updating order:', error);
  
      if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
        console.log('Connection lost during update. Attempting to reconnect...');
        await connectWithRetryForConsumerUpdate();
        await updateOrderRecettesByNumero(numero, updateData); // Retry the update after reconnecting
      } else {
        console.error('An error occurred that is not related to MongoDB connection. Update failed.');
      }
    }
  
 //   isUpdating = false;
  }


// async function updateOrderRecettesByNumero(numero, updateData) { // without reconnect
//     try {
//         const updatedOrder = await ordersRecettes.findOneAndUpdate(
//             { numero: numero }, // The filter criteria to find the document
//             {
//                 $set: {
//                     reference: updateData.reference,
//                     serviceBancaire: updateData.serviceBancaire,
//                     idTransaction: updateData.idTransaction,
//                     datePaiement: updateData.datePaiement,
//                     numeroQuittance: updateData.quittance.numeroQuittance,
//                     numeroTelephone: updateData.numeroTelephone,
//                     quittanceB64: updateData.quittanceB64,
//                     acquite: true
//                 }
//             },
//             { new: true } // Option to return the modified document rather than the original
//         );

//         if (updatedOrder) {
//             console.log('Order updated successfully:', updatedOrder);
//         } else {
//             console.log('Order not found');
//         }
//     } catch (error) {
//         console.error('Error updating order:', error);
//     }
// }



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




 

