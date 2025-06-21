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
app.post('/publishOrder', async (req, res) => {
  console.log('📦  Received JSON:', req.body);   // do whatever you need here

  const success = await runProducer(req.body);
  
  if (success) {
    res.status(200).json({ status: 'ok', received: req.body });
  } else {
    res.status(500).json({ status: 'error', message: 'Failed to process order' });
  }
});


/* -------- start server -------- */
app.listen(PORT, () => {
  console.log(`🔈  Server listening on http://localhost:${PORT}`);
});


async function runProducer(ordre) {
  try {
      const producer = kafka.producer();
      await producer.connect();
      
      const result = await producer.send({
          "topic": kafkaParams['topicProducer'],
          "messages": [
              {
                  "value": JSON.stringify(ordre),
                  "partition": 0
              }
          ]
      });

      await producer.disconnect();

      if (result[0]['errorCode'] == 0) {
          console.log('sent data = ');
          console.log(ordre);
          logOrdre(ordre);
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