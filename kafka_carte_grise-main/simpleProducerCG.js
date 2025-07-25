
const { Kafka } = require("kafkajs")
const { Client } = require('pg');
const mysql = require('mysql');

//var con = require('./Singleton');
const mySingletonConnection = require('./mySingletonConnection');

//import dbParams from ('./dbParameters.json')


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


envVars = require('./environmentVariables.json');




var dbParams, kafkaParams;



/* 

{

    "user": "postgres" ,
    "host":  "localhost" ,
    "database": "cartegrise"  ,
    "password": "postgres"  ,
    "port": 5433

}
 */


if (envVars['production']) {

    dbParams = require('./dbParametersProd.json');
    kafkaParams = require('./kafkaParametersProd.json');

} else {


    dbParams = require('./dbParameters.json');
    kafkaParams = require('./kafkaParameters.json');

}



 


/* {

    "user": "postgres",
    "host": "10.10.100.207",
    "database": "cartegrise",
    "password": "postgres",
    "port": 5432

}


{

    "user": "postgres",
    "host": "localhost",
    "database": "cartegrise",
    "password": "postgres",
    "port": 5433

} 


{
    "clientId": "myapp1",  // for localUse
    "brokers": ["localhost:9092"],
    "topicProducer": "carte-grise-producer-topic",
    "topicConsumer": "carte-grise-consumer-topic",
    "consumerGroupId": "test" 
}

{
    "clientId": "kafka_carte_grise_cid",  // for server use
    "brokers": ["192.168.7.200:30001"],
    "topicProducer": "or-carte-grise",
    "topicConsumer": "pay-or-cg",
    "consumerGroupId": "kafka_carte_grise_gid" 
}

*/


// use id_certificat 1088 et 589 pour les test

const kafka = new Kafka({
    "clientId": kafkaParams['clientId'],
    "brokers": kafkaParams['brokers']
})

const consumer = kafka.consumer({ "groupId": kafkaParams['consumerGroupId'] })

runConsumer();

const { DISCONNECT } = consumer.events
const removeListener = consumer.on(DISCONNECT, e => { 

    console.log(`------------------DISCONNECT at ${e.timestamp}`);
    runConsumer();
});

var occupiedFlag = false;

setInterval(() => {




    if (!occupiedFlag) {


        occupiedFlag = true;
        getOrdre2(function (err, data) {


            if (err) {
                console.lor("error");
                logException(err+" ; error at getOrdre2 level ");
            } else if (data && data.length > 0) {

                for (var i = 0; i < data.length; i++) {


                    runProducer(data[i]);
		    //console.log(data[i]);


                }

            } else {
                console.log('waiting for new orders');
            }
            occupiedFlag = false;
            //console.log(data);
        });
    } else {
        console.log("curriently occupied");
    }


}
    , 10000);




async function runProducer(ordre) {
    try {

        const producer = kafka.producer();
        //  console.log("Connecting.....")
        await producer.connect()
        //   console.log("Connected!")
        //A-M 0 , N-Z 1 
        //  const partition = msg[0] < "N" ? 0 : 1;
        const result = await producer.send({
            "topic": kafkaParams['topicProducer'],
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
                console.log('sent data = ');
                console.log(ordre);



                updateOrdre(ordre['numero'], ordre['montant'], function (err, data) {


                    if (err) {
                        logException(err+" ; error while updating ordre['numero'] ="+ ordre['numero']);
                        //   console.log('update made successfully');
                        //  console.log('data update = '+JSON.stringify(data));
                    }
                    ;



                });
            }

        })
            .catch(err => {
                logException(err);


            });


        await producer.disconnect();


    }
    catch (ex) {
        logException(err);
        console.error(`Something bad happened ${ex}`)
    }


}





function updateOrdre(numero, montant, callback) {

    uoflag = true;
    var handle = setInterval(

        function () {

            updateOrdreNestedFunction(montant, function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 10000);

    updateOrdreNestedFunction(montant , function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });


    function updateOrdreNestedFunction(montant , callback) {
        if (uoflag) {

            uoflag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {

                    logException(err);
                    mySingletonConnection.destroyConnection(function (err1, con) {
                        uoflag = true;
                    })

                } else {

                    var numeroBis, query;
                    var numeroAsString = numero.toString();


                    if (numero.indexOf('/DTT/') > -1) {

                        numeroBis = numero.split('/DTT/');
                        query = "UPDATE certificat SET sent = 1, montant ="+montant+" where id_certificat = '" + numeroBis[0] + "'";

                    } else {

                        query = "UPDATE certificat SET sent = 1 , montant = "+ montant+" where id_certificat = '" + numero + "'";
                    }

                    con.query(query, (err2, res) => {

                        if (err2) {

                            logException(err2 + " ; error while executing query = "+query);
                            mySingletonConnection.destroyConnection(function (err1, con) {
                                uoflag = true;
                            });
                            // callback(err, null);
                        } else {

                            callback(null, res);
                        }


                    });


                }
            })
        }
    }

}



function getOrdre2(callback) {



    go2flag = true;
    var handle = setInterval(

        function () {

            getOrdre2NestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 10000);



    getOrdre2NestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });


    function getOrdre2NestedFunction(callback) {



        // flag = true;
        if (go2flag) {

            go2flag = false;

            mySingletonConnection.getConnection(function (err1, con) {

                if (err1) {

                    mySingletonConnection.destroyConnection(function (err1, con) {
                        go2flag = true;
                    })

                } else {
	 
                    const query = `
    
                        SELECT  certificat.id_certificat as numero , 
                                vehicule.num_chassus  as vin, 
                                vehicule.marque as marque, 
                                vehicule.typev as type, 
                                genre.libelle_genre as genre,
                                vehicule.puissance as puissance_fiscal,
                                certificat.sequance_matricule as matricule ,
                                
                                vehicule.poids_charge as poids_charge, 
                                vehicule.poids_vide as poids_vide, 
                                certificat.id_prop as nni ,  
                                certificat.id_etablissement,
                                certificat.id_pays,
                        --      properietaire.nom_complet_prop as proprietaire, 
                        
                                
                                certificat.date_vente as date_mutation,
                                vehicule.nbr_places as nombre_places,
                                certificat.type_demande as type_demande_bis
                                    
                                
                        
                        FROM    certificat 
                                inner join vehicule        
                                    on certificat.id_veh = vehicule.id_veh
                                inner join genre
                                    on vehicule.id_genre = genre.id_genre
                            --   inner join  properietair  on certificat.id_prop = properietaire.nni
                        
                        WHERE certificat.sent = 0 and (certificat.etat_wf like 'validé_douane%' or certificat.etat_wf = 'validée')
                        limit 10

                        `;

                    con.query(query, (err2, res) => {
                        if (err2) {
			    console.log("err2 =" + err2);
                            logException(err2 + ";   error while executing query = "+query);
                            mySingletonConnection.destroyConnection(function (err1, con) {
                                go2flag = true;
                            });




                            console.log("error while executing query 2");
                            //   callback(err, null);

                        } else {

			 

                            output = [];

                            var cpt = 0;


                            if (res.rows.length == 0) {
                                callback(null, []);
                            } else {
			 
                                for (let row of res.rows) {
				
				    
				    cpt++;

                                    var proprietaire_query = "", flag = "";

                                    if (row['nni'] != null) {
                                        flag = "nni";
                                        proprietaire_query = "SELECT nom_complet_prop FROM properietaire WHERE nni = '" + row['nni'] + "'";

                                    } else if (row['id_etablissement'] != null) {
                                        flag = "id_etablissement";
                                        proprietaire_query = "SELECT libellefr FROM etablissement WHERE id_etablissement = '" + row['id_etablissement'] + "'";

                                        delete row['nni'];


                                    } else if (row['id_pays'] != null) {
                                        flag = "id_pays";
                                        proprietaire_query = "SELECT designation FROM pays WHERE id_pays = '" + row['id_pays'] + "'";

                                        // console.log("proprietaire_query = " + proprietaire_query);

                                        delete row['nni'];


                                    } else {
                                        //proprietaire_query = "SELECT designation FROM pays WHERE id_pays = '" + row['id_pays'] + "'"; // there has to be a query
                                        proprietaire_query = "SELECT nom_complet_prop FROM properietaire WHERE nni = '" + row['nni'] + "'"; // there has to be a query
                                        flag = "none";
                                    }

                                    con.query(proprietaire_query, (err3, res3) => {



                                        if (err3) {
                                            logException(err3+' ;error while executing : proprietaire_query = ' + proprietaire_query);
                                            mySingletonConnection.destroyConnection(function (err1, con) {
                                                go2flag = true;
                                            });
                                            console.log('proprietaire_query = ' + proprietaire_query);
                                            console.log('err3 = ' + err3);
                                            console.log("error while executing query 3");
                                            // callback(err, null);
                                        } else if (res3 != null && res3.rows.length > 0) {


                                            //  console.log("res3.rows[0] = " + JSON.stringify(res3.rows[0]));

                                            if (res3.rows[0]['nom_complet_prop'] != null) {
                                                row['proprietaire'] = res3.rows[0]['nom_complet_prop'];
                                            } else if (res3.rows[0]['libellefr'] != null) {
                                                row['proprietaire'] = res3.rows[0]['libellefr'];
                                            } else if (res3.rows[0]['designation'] != null) {


                                                row['proprietaire'] = res3.rows[0]['designation'];
                                            } else {
                                                row['proprietaire'] = null;
                                            }

                                        } else {
                                            row['proprietaire'] = null;
                                        }





                                        if (row['type_demande_bis'] == "CONVERSION") {

                                            row['typeDemande'] = "RENOUVELLEMENT CG";

                                        } else if (row['type_demande_bis'] == "MUTATION" || row['type_demande_bis'] == "CONVERSION_MUTATION") {

                                            row['typeDemande'] = "MUTATION";
                                        } if (row['type_demande_bis'] == "NOUVELLE" || row['type_demande_bis'] == "CONVERSION_REGIME" || row['type_demande_bis'] == "CONVERSION_BANALISE")
                                            row['typeDemande'] = "IMMATRICULATION"
                                        else if (row['type_demande_bis'] == "DUPLICATA" || row['type_demande_bis'] == "CONVERSION_DUPLICATA" || row['type_demande_bis'] == "CORRECTION") {
                                            row['typeDemande'] = "DUPLICATA"
                                        }

                                        var poids_charge = parseFloat(row["poids_charge"]);
                                        var poids_vide = parseFloat(row["poids_vide"]);

                                        var charge_utile = poids_charge - poids_vide;

                                        row['charge_utile'] = charge_utile;


                                        delete row['poids_charge'];
                                        delete row['poids_vide'];
                                        delete row['type_demande_bis'];

                                        var genre = row['genre'];

                                        var query_genre = "SELECT  type  FROM    genre  WHERE libelle_genre ='" + genre.toUpperCase() + "'";


                                        con.query(query_genre, (err4, res_genre) => {

                                            if (err4) {
                                                logException(err4+ '; error while executing  query_genre = ' + query_genre);
                                                mySingletonConnection.destroyConnection(function (err1, con) {
                                                    go2flag = true;
                                                });
                                                console.log("error while executing query 4");
                                                //  callback(err, null);
                                            } else {


                                                var res_genre;

                                                if (res_genre.rows[0] != undefined) {
                                                    res_genre = res_genre.rows[0]["type"];
                                                } else {
                                                    res_genre = 'VP';
                                                }


                                                if (res_genre == 'VP') {
                                                    query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '" + res_genre + "' and nb_place_max >=" + parseFloat(row['nombre_places']) + "  and  nb_place_min <=" + parseFloat(row['nombre_places']) + "";
                                                    row['genre'] = 'VP';
                                                } else if (res_genre == 'UT') {
                                                    query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '" + res_genre + "' and poid_max >=" + parseFloat(row['charge_utile']) + "  and  poid_min <=" + parseFloat(row['charge_utile']) + "";
                                                    row['genre'] = 'Vehicule Utilitaire';
                                                } else if (res_genre == 'TT') {
                                                    query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '" + res_genre + "'";
                                                    row['genre'] = 'Tout Terrain (4WD)';
                                                }

						 
                                                con.query(query_type_genre, (err5, res_type_genre) => {



                                                    if (err5) {
                                                        logException(err5 + '; error while executing  query_type_genre = ' + query_type_genre);
                                                        mySingletonConnection.destroyConnection(function (err1, con) {
                                                            go2flag = true;
                                                        });
                                                        console.log("error while executing query 5");
                                                        //   callback(err, null);

                                                    } else {


                                                        var resulat = [];
                                                        var i = 0;


 
                                                        if (res_type_genre.rows.length > 0) { // the length is always > 0, 

                                                            if (row['typeDemande'] == "IMMATRICULATION") {
                                                                row['montant'] = res_type_genre.rows[0]['immatriculation'];
                                                            } else if (row['typeDemande'] == "MUTATION") {


                                                                if (row['date_mutation'] != null) {

                                                                    var now = new Date();
                                                                    var date_mutation = new Date(row['date_mutation']);

                                                                    // To calculate the time difference of two dates
                                                                    var Difference_In_Time = now.getTime() - date_mutation.getTime();

                                                                    // To calculate the no. of days between two dates
                                                                    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);


                                                                    //if(now-dateMutation>3mois){
                                                                    if (Difference_In_Days > 92) { //92 days = 30 months
                                                                        row['montant'] = res_type_genre.rows[0]['mutation_hors_delai'];
                                                                    }
                                                                    else {
                                                                        row['montant'] = res_type_genre.rows[0]['mutation_dans_delai'];
                                                                    }
                                                                } else {

                                                          // row_type_genre           row['montant'] = row_type_genre['mutation_dans_delai']; // la variable n'existe pas je crois que je l'ai confondu avec res_type_genre
row['montant'] = res_type_genre.rows[0]['mutation_dans_delai'];
                                                                }
                                                            } else if (row['typeDemande'] == "RENOUVELLEMENT CG") {
                                                                row['montant'] = res_type_genre.rows[0]['remplacement'];
                                                            } else if (row['typeDemande'] == "DUPLICATA") {
                                                                row['montant'] = res_type_genre.rows[0]["deplucata"];
                                                            }

                                                            row['cac_ar'] = "إ ن ب";

                                                            row['cac_fr'] = "DTT";


                                                            var year = new Date().getFullYear().toString().substr(-2);

                                                            row['numero'] = row['numero'].toString();

                                                            //cpt++;

                                                            row['date_generation'] = new Date();
                                                            delete row['id_pays'];
                                                            delete row['id_etablissement'];

                                                            if (row['date_mutation'] == null) {

                                                                delete row['date_mutation'];
                                                            }

                                                            output.push(row);
							 

							 
						 

                                                            if (cpt == res.rows.length) {


                                                                if (err5) { // i think its unnecessary but if it works, dont change it.
                                                                    flag = true;
                                                                    //    callback(err, null);
                                                                } else {
						 
                                                                    callback(null, output);
                                                                }

                                                            }



                                                        }
                                                    }// if query_type_genre did not return error

                                                });// finquery_type_genre

                                            }// if query_genre did not return error

                                        });//query_genre


                                    });// finproprietaire_query

                                }//finfor // we iterate on every item

                            }// if query return data ==> data.length > 0
                        }// if query to the main table certificat did not return error



                    }); // query to the main table certificat

                }//if we connected to DB
            })
        }
    }




}




async function runConsumer() {
    try {


        var recette = {};

        /*         data ={};
                 
        data['numeroOrdreRecette'] = '578/DTT/22';
        data['reference'] = 'myreference';
        data['serviceBancaire'] = 'myserviceBancaire';
        data['idTransaction'] = 'myidTransaction';
        data['datePaiement'] = '2022-05-17';
        data['numeroQuittance'] = 'mynumeroQuittance8979';
        data['numeroTelephone'] = '36000000';
        data['quittanceB64'] = "base64Image";
        data['ordreRecette'] = {
            "numero": "588/DTT/22"
        };
        
        
        
        insertIntoRecettes(data, function (err, data) {
        
        
            if (err) {
                logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
        
                //throw err;
            } else {
                console.log('a row is inserted');
            }
        
        });
         */


        
        console.log("Connecting.....")
        await consumer.connect()
        console.log("Connected!")

        await consumer.subscribe({
            "topic": kafkaParams['topicConsumer'],
            "fromBeginning": true
        })




        await consumer.run({
            "eachMessage": async result => {

                console.log('')
                console.log('')
                //console.log(`received data =  ${result.message.value} `);



                recette = JSON.parse(`${result.message.value}`);
		
                console.log("received data  data['quittance']['quittanceNo']= " + recette['quittance']['quittanceNo']);
		 

                /* fs.writeFile('test.txt', JSON.stringify(recette), err => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    //file written successfully
                }); */




                insertIntoRecettes(recette, function (err, data) {


                    if (err) {
                        logException(err + " during the insert of recette['idTransaction'] = " + recette['idTransaction']);
                        saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);

                        //throw err;
                    } else {
                        console.log('a row is inserted');
                    }

                });



            }
        })

    }
    catch (ex) {
        logException(ex);

        if (recette['idTransaction']) {
            saveDataDuringException(JSON.stringify(recette), recette['idTransaction']);
        }

        var myError = ""+ex;

        if(myError.includes("KafkaJSNumberOfRetriesExceeded")){

            runConsumer();
            
        }
        // console.error(`Something bad happened ${ex}`)
    }
    finally {

    }


}


function insertIntoRecettes(data, callback) {


    var iirflag = true;
    var handle = setInterval(

        function () {

            insertIntoRecettesNestedFunction(function (err, resu) {

                clearInterval(handle);
                callback(null, resu);
            })

        }
        , 10000);



    insertIntoRecettesNestedFunction(function (err, resu) {

        clearInterval(handle);
        callback(null, resu);
    });



    function insertIntoRecettesNestedFunction(callback) {

        if (iirflag) {

            iirflag = false;

            mySingletonConnection.getConnection(function (err, con) {

                if (err) {

                    logException(err);
                    mySingletonConnection.destroyConnection(function (err1, con) {
                        iirflag = true;
                    });

                } else {

                    query = "Insert Into  recettes ( date_validation , path ,paiement_en_ligne ,    etat            , date_quittance                , reference                    , serviceBancaire                   , idTransaction                    , Quittance                          , numeroTelephone  , quittance_pdf , numero_recette ) \
                            VALUES (  now()        , 'none'  , 1                 ,  'Reçue'    , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['quittance']['quittanceNo'] + "'  ,  '" + data['numeroTelephone'] + "' ,  '" + data['quittanceB64'] + "'  , '" + data['ordreRecette']['numero'] + "'    )"

                    con.query(query, (err2, res) => {

                        if (err2) {
                            logException(err2 +"  ; error while executing query = "+query);
                            mySingletonConnection.destroyConnection(function (err1, con) {
                                iirflag = true;
                            })
                        } else {
                            
                            // New update query to execute after the insert
                            const updateQuery = "UPDATE certificat SET etat_wf = 'payée' WHERE id_certificat = '" + data['ordreRecette']['numero'] + "' AND etat_wf = 'validée' AND centre like '900%'";
                            con.query(updateQuery, (err3, updateRes) => {
                                if (err3) {
                                    logException(err3 + " ; error while executing update query = " + updateQuery);
                                }
                                console.log("update was successful");
                                callback(null, res);
                            });
                        }

                    });

                }
            })
        }
    }


};



function logException(error) {


    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' : ' + error + '\n\n');

}

function saveDataDuringException(data, id) {


    if (!fs.existsSync('./dataNotSavedInDB')) {
        fs.mkdirSync('./dataNotSavedInDB');
    }
    fs.appendFileSync('./dataNotSavedInDB/' + id, data);

}


function saveDataWithoutException(data, id) {


    if (!fs.existsSync('./dataSavedInDB')) {
        fs.mkdirSync('./dataSavedInDB');
    }
    fs.appendFileSync('./dataSavedInDB/' + id, data);

}


/* 
function insertIntoRecettesOLD(data, callback) {

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "recettes"
    });

    console.log(' data = ' + JSON.stringify(data));
  

    //data['numeroOrdreRecette'] 
    getOrdreById(data['numeroOrdreRecette'], function (err, retour) {

        if (retour.length > 0) {
            console.log('retour ' + JSON.stringify(retour));

            //------------------------------------------------>

            var datePaiement = data['datePaiement'];
            var Nature_encaiss = '';
            const myArray = datePaiement.split("-");
 

            var name = recettesFolder + retour[0]['codecac'] + '/' + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/' + data['numeroQuittance'] + '.pdf';

            console.log('typedoc = ' + retour[0]['typedoc']);
            if (retour[0]['typedoc'] == 5) {
                Nature_encaiss = 'CNI';
            } else if (retour[0]['typedoc'] == 6) {
                Nature_encaiss = 'NP';
            } else if (retour[0]['typedoc'] == 7) {
                Nature_encaiss = 'VIP';
            } else if (retour[0]['typedoc'] == 8) {
                Nature_encaiss = 'CR';
            }
            // (5 = CNI) (6 NP) (7 VIP) (8 CR)

            data['path'] = name;

            var document = data['ordreRecette'];
            console.log();

            var dir = recettesFolder + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFile(name, document, { encoding: 'base64' }, function (err) {
                if (err)
                    throw err;
                else
                    console.log('File created ');
            });

            //<------------------------------------------------

            con.connect(function (err) {
                if (err) throw err;
                //con.query("Insert Into  recettes ( date_validation , Nature_encaiss, paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette , path  , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone ) VALUES (  SYSDATE() ,'" + Nature_encaiss + "', 1 , " + retour[0]['transport'] + " ," + retour[0]['montant'] + ", '" + retour[0]['codecac'] + "' , 'Reçue', SYSDATE() , '" + data['numeroOrdreRecette'] + "' ,  '" + data['path'] + "'   , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['numeroQuittance'] + "'  ,  '" + data['numeroTelephone'] + "' )", function (err, result, fields) {

                con.query("Insert Into  recettes ( date_validation , paiement_en_ligne , MontantTrans , montant , cac , etat , date_saisie, Orde_recette , date_quittance , reference, serviceBancaire , idTransaction  , Quittance , numeroTelephone ) VALUES (  SYSDATE() , 1 , " + retour[0]['transport'] + " ," + retour[0]['montant'] + ", '" + retour[0]['codecac'] + "' , 'Reçue', SYSDATE() , '" + data['numeroOrdreRecette'] + "'    , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['numeroQuittance'] + "'  ,  '" + data['numeroTelephone'] + "' )", function (err, result, fields) {

                    if (err)
                        callback(err, null);

                    else
                        callback(null, result);

                    con.end(function (err) {
                        if (err) throw (err);
                        else {
                            //        console.log('The database connection has been terminated.');
                        }
                    });
                });

            });
        }
        //console.log(data);



    });


} */
