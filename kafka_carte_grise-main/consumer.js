//const Kafka = require("kafkajs").Kafka
const {Kafka} = require("kafkajs");
var mysql      = require('mysql');
 

run();
async function run(){
    try
    {
         const kafka = new Kafka({
              "clientId": "myapp1",
              "brokers" :["localhost:9092"]
         })

        const consumer = kafka.consumer({"groupId": "test1"})
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")
        
        await consumer.subscribe({
            "topic": "topic1",
            "fromBeginning": true
        })
        

        
        await consumer.run({
            "eachMessage": async result => {
                //console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
                console.log('')
                console.log('')
                console.log(`received data =  ${result.message.value} `)

              

              getOrdre(result.message.value,  function (err, data) {

             //   console.log(data);
                runProducer(data);
              
              
              }); 
            

                
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




async function runProducer(data){
    try
    {
         const kafka = new Kafka({
              "clientId": "myapp2",
              "brokers" :["localhost:9092"]
         })

        const producer = kafka.producer();
        console.log("Connecting.....2")
        await producer.connect()
        console.log("Connected! 2")
        //A-M 0 , N-Z 1 
      //  const partition = msg[0] < "N" ? 0 : 1;
      //  var msg = 'coming from runProducer';


        console.log();
        console.log();
     //   console.log('data to be sent = '+data);
        const result =   producer.send({
            "topic": "topic2",
            "messages": [
                {
                    "value": data,
                    "partition": 0
                }
            ]
        })
      
        





        //console.log(`Send Successfully! ${JSON.stringify(result)}`)
        console.log('Send Successfully! '+ data)
        await producer.disconnect();
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
    finally{
       // process.exit(0);
    }


}






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
          callback(null, JSON.stringify(event));
      });
  
    });
  }