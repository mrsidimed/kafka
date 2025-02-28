
const { Kafka } = require("kafkajs")
const mysql = require('mysql');



// Load the configuration from the JSON file
const config = require('./params_project_mysql/typedoc_config.json');

envVars = require('./environmentVariables.json');
//var con = require('./Singleton');

const mySingletonConnection = require('./mySingletonConnection');

var dbParams, kafkaParams, intervalDuration, numberOfOrders;



if (envVars['production']) {

    //recettesFolder = "/root/Documents/recettes_passeport/";
    //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParametersProd.json');
    kafkaParams = require('./params_kafka/kafkaParametersProd.json');

} else {

    //  recettesFolder = "recettes/"
    dbParams = require('./params_project_mysql/dbParameters.json');
    kafkaParams = require('./params_kafka/kafkaParameters.json');

}




const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');





 



function sleep(seconds) {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


// Mapping between document names (typedoc_config.json)and ordres.TYPEDOC numbers
const docTypeMapping = {
    passeport_normal: '6',
    passeport_vip: '7',
    carte_identite: '5',
    carte_resident: '8',
    extrait_naissance: '9',
    casier_judiciaire: '4'
};





/* 
 


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

const kafka = new Kafka({
    // "clientId": "myapp1",
    "clientId": kafkaParams["clientId"],
    //    "brokers": ["localhost:9092"]
    "brokers": kafkaParams["brokers"]
})
var occupiedFlag = false;
 
 
 
 


 

// setInterval(() => { // uncomment when mongo works
 
//     if (!occupiedFlag ) {

//         occupiedFlag = true;
//         getOrdre(function (err, data) {
          
           
//             if (err) {

//                 logException(err)
//             } else if (data.length > 0) {
               
                
//                 for (var i = 0; i < data.length; i++) {
                    
//                     data[i]['date_generation'] = new Date();

//                     console.log("data["+i+"]");

//                     runProducer(data[i]);
//                 }

                
//             } else {
//                 console.log('waiting for new orders');
//             }

//             occupiedFlag = false;
//         });
//     } else {
//         console.log("curriently occupied");
//     }

// }
//     , kafkaParams["intervalDuration"]);
 

    let arrayNums =  []  ;
    let counter =  0  ;
    let lotReceivedSize =  0  ;

    function sendOrders() {
        if (!occupiedFlag) {
            occupiedFlag = true;
            getOrdre(function (err, data) {
                if (err) {
                    logException(err);
                } else if (data.length > 0) {
                    lotReceivedSize = data.length;
                    for (var i = 0; i < data.length; i++) {
                        data[i]['date_generation'] = new Date();
                 

                        data[i]['typeDocument'] =  data[i]['TYPEDOC'] + '-' + data[i]['typeDocument'];
                        delete data[i].TYPEDOC;

                        data[i]['montant'] =  data[i]['montant'] + data[i]['transport'];

                        runProducer(data[i]);
                    }
                } else {
                    console.log('waiting for new orders');
                }
                occupiedFlag = false;
            });
        } else {
            console.log("currently occupied");
        }
    }
    
    // Execute the function immediately
    sendOrders();
    
    // Then use setInterval to execute it every 20000 milliseconds
    setInterval(sendOrders, kafkaParams["intervalDuration"]);
 
 
    
    
    

function getOrdre(callback) {


    var flag = true;
    var handle = setInterval(

        function () {

            getOrdreNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 20000);



    getOrdreNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });



    function getOrdreNestedFunction(callback) {


        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {
                    logException(err);
                    flag = true;

                } else {
                    // ordres.TYPEDOC = '6' (NP : "passeport_normal")
                    // ordres.TYPEDOC = '7' (VP : "passeport_VIP")
                    // ordres.TYPEDOC = '5' (ID : "carte_identite")
                    // ordres.TYPEDOC = '8' (CR :  "carte_resident")
                    // ordres.TYPEDOC = '9' (NP : "extrait_naissance")
                    // ordres.TYPEDOC = '4' (CJ : "casier_judiciaire")

                    // Prepare the SQL query
                    const typedocValues = Object.keys(config)
                        .filter(key => config[key])
                        .map(key => `'${docTypeMapping[key]}'`);

                    const typedocSqlPart = `ordres.TYPEDOC IN (${typedocValues.join(', ')})`;

                    


                    var queryOrdre = "SELECT ordres.numero , ordres.nni , ordres.TYPEDOC , ordres.PRENOM_FR as prenomFr, ordres.PRENOM_AR as prenomAr , ordres.NOM_FAMILLE_FR as nomFamilleFr ,  ordres.NOM_FAMILLE_AR as nomFamilleAr , ordres.DATE_NAISSANCE as dateNaissance, ordres.LIEU_NAISSANCE_FR as lieuNaissanceFr , ordres.LIEU_NAISSANCE_AR as lieuNaissanceAr , ordres.MONTANT as montant , ordres.TRANSPORT as transport  ,typedemande.libelle  as typeDemande , typedocument.libelle  as typeDocument  ,cac.nom_cac as cacFr , cac.nom_cac as cacAr, cac.nom_cacar as cacAr  FROM ordres inner join typedemande on typedemande.code = ordres.TYPEDEM inner join typedocument on typedocument.code = ordres.TYPEDOC inner join cac on ordres.codecac = cac.cac "
                        //   +" where sent = 0  and (ordres.TYPEDOC = '6' or ordres.TYPEDOC = '7'  ) and ordres.numero not like '00%' limit 10";
                        + "WHERE sent = 0  LIMIT " + kafkaParams["numberOfOrders"];
 

                      //  console.log(queryOrdre);

                    con.query(queryOrdre, function (err, result, fields) {

                        if (err) {

                            logException(err + ";   error while executing query = " + queryOrdre);
                            //console.log()
                            flag = true;
                            //callback(err, null);
                        } else {

                            // clearInterval(handle);

                            
                            var resu = JSON.parse(JSON.stringify(result));

                            callback(null, resu);
                        }


                    });


                }
            })
        }


    }



}


function updateOrdre(numero, arrayNums, callback) {

    var flag = true;
    var handle = setInterval(

        function () {

            updateOrdreNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })
        }
        , 10000);



    updateOrdreNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });

    function updateOrdreNestedFunction(callback) {

        if (flag) {

            flag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {
                    logException(err);
                    flag = true;

                } else {

                    var queryUpdateOrdre = "UPDATE ordres SET sent = 1 WHERE NUMERO IN (" + arrayNums.map(num => `'${num}'`).join(", ") + ")";


                  //  var queryUpdateOrdre = "UPDATE ordres SET sent = 1 where NUMERO = '" + numero + "'";
                    con.query(queryUpdateOrdre, function (err, result, fields) {

                        if (err) {

                            logException(err + " error while exwcuting query : " + queryUpdateOrdre);
                            console.log("Error while executing an update query");

                            flag = true;

                        } else {
                            //clearInterval(handle);

                            console.log("all orders were updated ");
                            console.log(queryUpdateOrdre);


                            callback(null, result);
                        }
                    });
                }
            })
        }
    }



}

async function runProducer(ordre) {
    

       
        const producer = kafka.producer();
    try {
        
        //  console.log("Connecting.....")
        await producer.connect()
        console.log("--------------------- connected ");
        
        //   console.log("Connected!")
        //A-M 0 , N-Z 1 
        //  const partition = msg[0] < "N" ? 0 : 1;

        

        const result = await producer.send({
            //  "topic": "topic2"  kafkaParams["topicConsumer"][],
            "topic": kafkaParams["topicProducer"],
            "messages": [
                {
                    "value": JSON.stringify(ordre),
                    "partition": 0
                }
            ]
        }).then(result => {

            if (result[0]['errorCode'] == 0) {

                console.log('');
                console.log('');
                console.log('sent data === ');

                logOrdre(JSON.stringify(ordre));

                console.log(ordre);
                 
                arrayNums.push(ordre['numero']);
                counter++;

                

            }else{

                counter++;

            }

            if(counter==lotReceivedSize){

                updateOrdre(ordre['numero'], arrayNums, function (err, data) {

                    if (err) {

                        logException(err);

                    }else{
                        arrayNums = [];
                        counter = 0;
                    }

                });

            }

        })
            .catch(err => {

                
                
                logException(err);
              


            });


        await producer.disconnect();
    


    }
    catch (ex) {

        logException(ex);
        console.log("--------------------- disconnected ");
        //occupiedFlag = true;
      
        console.error(`Something bad happened ${ex}`)
    }


}

function logOrdre(ordre) {

    console.log("inside paiement");
    if (!fs.existsSync('./ordres')) {
        fs.mkdirSync('./ordres');
    }
    fs.appendFileSync('./ordres/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + ordre + '\n\n');

}

function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}
