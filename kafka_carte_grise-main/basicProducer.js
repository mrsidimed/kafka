
const {Kafka} = require("kafkajs")
const mysql = require('mysql');

/* var clientId ="myapp1";  // for local use
var brokers = ["localhost:9092"];
var topic =  "topic3";
var groupId = "test3" ; */
// 10.10.100.90

var clientId ="kafka_carte_grise_cid"; // for server use
var brokers = ["192.168.7.200:30001"];
var topic =  "or-carte-grise";
var groupId = "kafka_passeport_gid" ;

const kafka = new Kafka({
    "clientId": clientId,
    "brokers" :brokers
});

const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


 
var mess = "this is a test";
runProducer(mess);

 


async function runProducer(ordre){
    try
    {
         

        const producer = kafka.producer();
      //  console.log("Connecting.....")
        await producer.connect()
     //   console.log("Connected!")
        //A-M 0 , N-Z 1 
      //  const partition = msg[0] < "N" ? 0 : 1;
        const result =  await producer.send({
            "topic": topic,
            "messages": [
                {
                    "value": ordre,
                    "partition": 0
                }
            ]
        }).then(result => {
             
            
            if(result[0]['errorCode']== 0){

                console.log('');
                console.log('');
                console.log('sent data = ' + JSON.stringify(ordre));
 
            }
            
          })
          .catch(err => {
            console.log('error = '+err);
            
          });

        
        await producer.disconnect();

        
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
   

}




 
 
 