//const Kafka = require("kafkajs").Kafka
const {Kafka}  = require("kafkajs");
var mysql      = require('mysql');


/* var clientId ="myapp1";
var brokers = ["localhost:9092"];
var topic =  "topic3";
var groupId = "test3" ; */



var clientId ="myapp1";  // for local use
var brokers = ["localhost:9092"];
var topic =  "topicC3";
var groupId = "gid333" ;


isConnected = false;


/* var clientId ="kafka_passeport_cid"; // for server use
var brokers = ["192.168.7.200:30001"];
var topic =  "pay-or-doc";
var groupId = "kafka_passeport_gid" ; */


const kafka = new Kafka({
    "clientId": clientId,
    "brokers" : brokers
});

console.log("-----------------------");
const consumer = kafka.consumer({"groupId": groupId});
 

runConsumer();


const { DISCONNECT } = consumer.events
const removeListener = consumer.on(DISCONNECT, e => { 

    console.log(`------------------DISCONNECT at ${e.timestamp}`);
    runConsumer();
});


 


async function runConsumer(){
    try
    {
        /*  const kafka = new Kafka({
              "clientId": "myapp1",
              "brokers" :["localhost:9092"]
         }) */

        
        console.log("Connecting.....")
        await consumer.connect();
        
        isConnected = true;
        console.log("Connected!")
        
        await consumer.subscribe({
            "topic": topic,
            "fromBeginning": true
        })
    
        var counter = 0;

 /*        consumer.on('error', function(error)
        {
            console.log('error --------------------------------------------------', error);
        });
        */
        await consumer.run({

            
            "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
/* 
                counter++
                if (counter == 2) {
                    counter = 0;
                    console.log("sleep 4 secs");
                    consumer.pause([{ topic }])
                    setTimeout(() => consumer.resume([{ topic }]), 4 * 1000)
                } */
                console.log('')
                console.log('')
                console.log(`received data =  ${result.message.value} `)

                try {
                    console.log(`received data =  ${result.message.value} `)
                } catch (e) {

                    console.log("-----------------------------------------");

/*                     try {
                        console.warn('Failed to process message, sending to DLQ', { topic, partition, offset: message.offset, error: e })
        
                        await producer.send({
                            topic: DLQ_TOPIC,
                            messages: [message]
                        })
                    } catch (e) {
                        console.error('Failed to send message to dead letter queue', { error: e })
        
                        // When failing to send the message to the DLQ, we re-throw so that we don't
                        // commit the offset, and instead re-consume the message
                        throw e
                    } */
                }
                
            }
        }).catch(error => {
            console.log("error = "+ error);
        });

    }
    catch(ex)
    {
        var myError = ""+ex;

        if(myError.includes("KafkaJSNumberOfRetriesExceeded")){

            runConsumer();
            console.log("KafkaJSNumberOfRetriesExceeded inside------------------");
        }else{
            console.log("KafkaJSNumberOfRetriesExceeded outside------------------");
        }
        
        
        //console.error(`Something bad happened ${ex}`);
        isConnected = false;
      
    }
    finally{
        
    }


}


 

 


