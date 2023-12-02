import Kafka from 'node-rdkafka';
import eventType from '../eventType.js';
import facture from '../facture.js';
import mysql from 'mysql';



 
 



 
const stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': 'localhost:9092'
}, {}, {
  topic: 'test'
});

stream.on('error', (err) => {
  console.error('Error in our kafka stream');
  console.error(err);
});



 


getOrdre("030101511120023", function (err, data) {


  const success = stream.write(eventType.toBuffer(data));
   
  if (success) {
    console.log(`message queued (${JSON.stringify(data)})`);
  } else {
    console.log('Too many messages in the queue already..');
  }


});




function getOrdre(numero, callback) {


  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "recettes"

  });

  con.connect(function (err) {
    if (err) throw err;
    con.query("SELECT * FROM ordres where numero = '" + numero + "'", function (err, result, fields) {
      if (err) throw err;
      var rows = JSON.parse(JSON.stringify(result));

      var event = {};

      event['NUMERO'] = rows[0]['NUMERO'];
      event['NNI'] = rows[0]['NNI'];
      event['MONTANT'] = rows[0]['MONTANT'];
      event['PRENOM_FR'] = rows[0]['PRENOM_FR'];
      event['NOM_FAMILLE_FR'] = rows[0]['NOM_FAMILLE_FR'];

      // here you can access rows
      //  console.log('-->' + rows[0]);

      if (err)
        callback(err, null);
      else
        callback(null, event);
    });

  });
}
