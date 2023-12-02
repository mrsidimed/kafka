//const Kafka = require("kafkajs").Kafka
const {Kafka}  = require("kafkajs");
var mysql      = require('mysql');
 
const kafka = new Kafka({
    "clientId": "myapp1",
    "brokers" :["localhost:9092"]
});

var base64Image = "JVBERi0xLjMKJeLjz9MKMSAwIG9iago8PCAKL0NyZWF0b3IgKENhbm9uICkKL0NyZWF0aW9uRGF0ZSAoRDoyMDIyMDMyOTE1MwPn2+WjlmvjBThL4HcwfAA/4kcnyj/+IApzdGFydHhyZWYKNjQwMDcxCiUlRU9GCg==";

var dbParams , kafkaParams ;

envVars = require('./environmentVariables.json');
if(envVars['production']){

    //recettesFolder = "/root/Documents/recettes_passeport/";
  //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParametersProd.json');
    kafkaParams = require('./params_kafka/kafkaParametersProd.json');

}else{

  //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParameters.json');
    kafkaParams = require('./params_kafka/kafkaParameters.json');

}

function getRandomNumberBetween(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

data ={};
//data['numeroOrdreRecette'] = '060401511120007';

 

data['ordreRecette'] = {
    'numero': '900001511120006'
    
}
data['reference'] = 'myreference';
data['serviceBancaire'] = 'myserviceBancaire';
data['idTransaction'] = 'myidTransaction';
data['datePaiement'] = '2020-04-17';
//data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

data['quittance'] = {
    'quittanceNo': ''+getRandomNumberBetween(0,1000000)
}
data['numeroTelephone'] = '36055868';
data['quittanceB64'] = 'base64Image';

console.log(data)

runProducer(data);
runConsumer();


/* 



{
  ordreRecette: { numero: '060401511120007' },
  reference: 'myreference',
  serviceBancaire: 'myserviceBancaire',
  idTransaction: 'myidTransaction',
  datePaiement: '2020-04-17',
  quittance: { quittanceNo: '675056' },
  numeroTelephone: '36055868',
  quittanceB64: 'base64Image'
}





{ 
    "clientId": "myapp1", // for local use
    "brokers": ["localhost:9092"],
    "topicProducer": "topic1",
    "topicConsumer": "topic2",
    "consumerGroupId": "test" 
}

{
    "clientId": "kafka_passeport_cid",  
    "brokers": ["192.168.7.200:30001"],
    "topicProducer": "or-document",
    "topicConsumer": "pay-or-doc",
    "consumerGroupId": "kafka_passeport_gid" 
}


 */

async function runConsumer(){

    console.log("test");
    try
    {
         const kafka = new Kafka({
              "clientId": kafkaParams["clientId"],
              "brokers" :  kafkaParams["brokers"] 
         })

        const consumer = kafka.consumer({"groupId": kafkaParams["consumerGroupId"]})
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")
        
        await consumer.subscribe({
            "topic": kafkaParams["topicProducer"],
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
        console.error(`Something bad happened ${ex}`)
    }
    finally{
        
    }


}



function getOrdre(callback) {

 

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "recettes"
    
      });

    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT NUMERO, NNI, PRENOM_FR, NOM_FAMILLE_FR, MONTANT FROM ordres where sent = 0", function (err, result, fields) {
            if (err) throw err;
            var resu = JSON.parse(JSON.stringify(result));

            // here you can access rows
            //  console.log('-->' + rows[0]);

            if (err)
                callback(err, null);
            else
                callback(null, resu);

                con.end(function(err){
                    if(err)throw(err);
                    else {
                        //console.log('The database connection has been terminated.');
                    }
                });
        });
        

    });

    


 

}




async function runProducer(ordre){
    try
    {
         
        const producer = kafka.producer();
      //  console.log("Connecting.....")
        await producer.connect()
     //   console.log("Connected!")
        //A-M 0 , N-Z 1 
      //  const partition = msg[0] < "N" ? 0 : 1;

      console.log("kafkaParams['topicConsumer'] =" +kafkaParams["topicConsumer"]);
        const result =  await producer.send({
            "topic": kafkaParams["topicConsumer"],
            "messages": [
                {
                    "value": JSON.stringify(ordre),
                    "partition": 0
                }
            ]
        }).then(result => {
             
            
            if(result[0]['errorCode']== 0){

                console.log('');
                console.log('');
                console.log('sent data = ' +  ordre['quittance']['quittanceNo']);

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



  