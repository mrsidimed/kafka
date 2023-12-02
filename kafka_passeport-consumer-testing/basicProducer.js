
const {Kafka} = require("kafkajs")
const mysql = require('mysql');


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');



/* { 
    "clientId": "myapp1",
    "brokers": ["localhost:9092"],
    "topicProducer": "topic1",
    "topicConsumer": "topic2",
    "consumerGroupId": "test" 
}
 */


 

var clientId ="myapp1";  // for local use
var brokers = ["localhost:9092"];
var topic =  "topicC3";
var groupId = "gid333" ;


/* var clientId ="kafka_passeport_cid"; // for server use
var brokers = ["192.168.7.200:30001"];
var topic =  "or-document";
var groupId = "kafka_passeport_gid" ; */

const kafka = new Kafka({
    "clientId": clientId,
    "brokers" :brokers
});
 
var mess = process.argv.slice(2)[0];
 
    
 
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




 
 
 