import Kafka from 'node-rdkafka';
import eventType from '../eventType.js';
import facture from '../facture.js';

var consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092',
}, {});

consumer.connect();

consumer.on('ready', () => {
  console.log('consumer ready..')
  consumer.subscribe(['test']);
  consumer.consume();
}).on('data', function(data) {

  
  

  const event = eventType.fromBuffer(data.value);

  console.log('data.value = '+event['NUMERO']);
 
  //console.log(`received message: ${event.}`);
  //console.log(`received message: ${eventType.fromBuffer(data.value)}`);
});
