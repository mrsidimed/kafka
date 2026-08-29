const axios = require('axios');
const fs      = require('fs'); 
const { Kafka } = require("kafkajs")


 
 

// const sampleOrdre = {
//   numero           : '123/DTT/25',
//   vin              : 'ABC123XYZ9876543',
//   marque           : 'TOYOTA',
//   type             : 'Corolla',
//   genre            : 'VP',
//   puissance_fiscal : 10,
//   matricule        : '1234-AA-25',
//   charge_utile     : 600,
//   proprietaire     : 'John Doe',
//   typeDemande      : 'IMMATRICULATION',
//   montant          : 12345,
//   date_generation  : new Date()
// };



const sampleOrdre = {"numero":"468371",
  "vin":"SB1DD56LA0E014260",
  "marque":"Toyota",
  "type":"AVENSIS",
  "genre":"VP",
  "montant":2500,
  "puissance_fiscal":7,
  "matricule":"4668 AS 00",
  "nni":"7289015434",
  "date_mutation":"2023-06-10",
  "nombre_places":4,
  "proprietaire":"Sidi Mohamed Lemine Mohamd'Ahid",
  "type_demande":"MUTATION",
  "charge_utile":475,
  "cac_ar":"إ ن ب",
  "cac_fr":"DTT",
  "date_generation":"2026-06-22T09:02:55.663Z"
}

const envVars = require('./environmentVariables.json');
var kafkaParams  ;
if (envVars['production']) {
   
  kafkaParams = require('./kafkaParametersProd.json');

} else {

  kafkaParams = require('./kafkaParameters.json');

}


const kafka = new Kafka({
  "clientId": kafkaParams['clientId'],
  "brokers": kafkaParams['brokers']
})



// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

/* -------- middleware -------- */
// built-in JSON parser (works in Express ≥4.16)
app.use(express.json());

/* -------- routes -------- */
// app.post('/publishOrder', async (req, res) => {
//   console.log('📦  Received JSON:', req.body);   // do whatever you need here

//   const success = await runProducer(req.body);
  
//   if (success) {
//     res.status(200).json({ status: 'ok', received: req.body });
//   } else {
//     res.status(500).json({ status: 'error', message: 'Failed to process order' });
//   }
// });

/* -------- start server -------- */
// app.listen(PORT, () => {
//   console.log(`🔈  Server listening on http://localhost:${PORT}`);
// });


 

  // With this:
(async () => {
  const success = await runProducer(sampleOrdre);
  if (success) {
    console.log('Order processed');
  } else {
    console.log('Failed to process order');
  }
})();

async function runProducer(ordre) {
  try {
      const producer = kafka.producer();
      await producer.connect();
      
      const result = await producer.send({
          "topic": kafkaParams['topicProducer'],
          "messages": [
              {
                  "value": JSON.stringify(transformData(ordre)),
                  "partition": 0
              }
          ]
      });

      await producer.disconnect();

      if (result[0]['errorCode'] == 0) {
          console.log('sent data = ');
          console.log(transformData(ordre));
          logOrdre(transformData(ordre));
          return true;
      } else {
          return false;
      }

  } catch (ex) {
      logException(ex);
      console.error(`Something bad happened ${ex}`);
      return false;
  }
}



function transformData(data) { // Adias are imposing a new format for the data
  const newData = {
    receiptOrderNumber: 'ANR'+ data.numero, 
    amount: data.montant,
    receiptType: "CARTE_GRISE", 
    dateGeneration: data.date_generation,
    puissanceFiscal: data.puissance_fiscal,
    chargeUtile: data.charge_utile,
    customerName:  data.proprietaire,
    customerPhone: null,

    dateMutation: data.date_mutation,
    nombrePlaces: data.nombre_places,
    cacAr: data.cac_ar,
    cacFr: data.cac_fr,
    typeDemande: data.type_demande,

    ...data
  

  };


  delete newData.date_mutation;
  delete newData.nombre_places;
  delete newData.cac_ar;
  delete newData.cac_fr;
  delete newData.type_demande;

  delete newData.numero;
  delete newData.montant;
  delete newData.date_generation;
  delete newData.puissance_fiscal;
  delete newData.charge_utile;
  

  return newData;
}



function logOrdre(ordre) {

  console.log("inside ordre");
  if (!fs.existsSync('./ordres')) {
      fs.mkdirSync('./ordres');
  }
  fs.appendFileSync('./ordres/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + JSON.stringify(ordre) + '\n\n');

}

 

function logException(error) {


  if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
  }
  fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}












// FOR TESTING 

// curl -X POST http://localhost:3001/publishOrder \
//      -H "Content-Type: application/json" \
//      -d '{"message":"hello","value":42}'