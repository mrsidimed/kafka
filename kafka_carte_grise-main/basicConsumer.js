//const Kafka = require("kafkajs").Kafka
const {Kafka}  = require("kafkajs");
var mysql      = require('mysql');
 


/* var clientId ="myapp1"; // for server use
var brokers = ["localhost:9092"];
var topic =  "topic3";
var groupId = "test3" ; */

var clientId ="kafka_passeport_cid"; // for server use
var brokers = ["192.168.7.200:30001"];
var topic =  "pay-or-doc";
var groupId = "kafka_passeport_gid" ;



const kafka = new Kafka({
    "clientId": clientId,
    "brokers" :brokers
});


 
runConsumer();

async function runConsumer(){
    try
    {
        /*  const kafka = new Kafka({
              "clientId": "myapp1",
              "brokers" :["localhost:9092"]
         }) */

        const consumer = kafka.consumer({"groupId": groupId})
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")
        
        await consumer.subscribe({
            "topic": topic,
            "fromBeginning": true
        })
    
        await consumer.run({
            "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
                console.log('')
                console.log('')
                console.log(`received data =  ${result.message.value} `)

  
                
            }
        })

    }
    catch(ex)
    {
       // console.error(`Something bad happened ${ex}`)
    }
    finally{
        
    }


}

 


  