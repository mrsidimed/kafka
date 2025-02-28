
   
//const Kafka = require("kafkajs").Kafka
const {Kafka} = require("kafkajs")
const num = process.argv[2];
runConsumer();
run();


async function run(){
    try
    {
         const kafka = new Kafka({
              "clientId": "myapp1",
              "brokers" :["localhost:9092"]
         })

        const producer = kafka.producer();
        console.log("Connecting.....")
        await producer.connect()
        console.log("Connected!")
        //A-M 0 , N-Z 1 
      //  const partition = msg[0] < "N" ? 0 : 1;
        const result =  await producer.send({
            "topic": "topic1",
            "messages": [
                {
                    "value": num,
                    "partition": 0
                }
            ]
        })
       // console.log(`Send Successfully! ${JSON.stringify(result)}`);
        console.log('');
        console.log('');
        console.log('sent data = ' + num);
        await producer.disconnect();

        
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
/*     finally{
        process.exit(0);
    } */


}



async function runConsumer(){
    try
    {
         const kafka = new Kafka({
              "clientId": "myapp2",
              "brokers" :["localhost:9092"]
         })

        const consumer = kafka.consumer({"groupId": "test2"})
        console.log("Connecting..... 2")
        await consumer.connect()
        console.log("Connected! 2")
        
        await consumer.subscribe({
            "topic": "topic2",
            "fromBeginning": true
        })
        
        await consumer.run({
            "eachMessage": async result => {
                console.log('')
                console.log('')
                console.log(`received data = ${result.message.value}`)
            }
        })
 

    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
    finally{
        
    }


}


