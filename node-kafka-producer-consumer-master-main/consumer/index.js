import Kafka from 'node-rdkafka';
import eventType from '../eventType.js';
import facture from '../facture.js';







/////////////////////////
 
//-------------->

const stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': 'localhost:9092'
}, {}, {
  topic: 'test'
});

stream.on('error', (err) => {
  console.error('Error in our kafka stream');
  console.error(err);
});

//<---------------


var event = {};
event['NUMERO'] = "030101511120023";
event['NNI'] = 'null';
event['MONTANT'] = 0;
event['PRENOM_FR'] = 'null';
event['NOM_FAMILLE_FR'] = 'null';


const success = stream.write(eventType.toBuffer(event));

if (success) {
  console.log(`message queued (${JSON.stringify(event)})`);

  var consumer = new Kafka.KafkaConsumer({
    'group.id': 'kafka2',
    'metadata.broker.list': 'localhost:9092',
  }, {});
  
  consumer.connect();
  
  consumer.on('ready', () => {
    console.log('consumer ready..')
    consumer.subscribe(['test']);
    consumer.consume();
  }).on('data', function (data) {
  
  
  
    console.log('data = ' + data);
    const result = eventType.fromBuffer(data.value);
  
    console.log('data.value = ' + result);
  
  
  });

} else {
  console.log('Too many messages in the queue already..');
}

/////////////
///////////
/////////






