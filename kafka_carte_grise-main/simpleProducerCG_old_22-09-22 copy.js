
const { Kafka } = require("kafkajs")
const { Client } = require('pg');
const mysql = require('mysql');

//import dbParams from ('./dbParameters.json')


const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');


envVars = require('./environmentVariables.json');




var dbParams, kafkaParams;


if (envVars['production']) {

    dbParams = require('./dbParametersProd.json');
    kafkaParams = require('./kafkaParametersProd.json');



} else {


    dbParams = require('./dbParameters.json');
    kafkaParams = require('./kafkaParameters.json');

}



const kafka = new Kafka({
    "clientId": kafkaParams['clientId'],
    "brokers": kafkaParams['brokers']
});



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
runConsumer();

var occupiedFlag = false;

setInterval(() => {


    console.log('waiting for new Orders ');

    if(!occupiedFlag){

            occupiedFlag = true;
            getOrdre2(function (err, data) {


                console.log("data.length = " + data.length);
                if (data.length > 0) {

                    for (var i = 0; i < data.length; i++) {

                        console.log(data[i]);
                        runProducer(data[i]);
                        

                    }

                } else {
                    console.log('waiting for new orders');
                }
                occupiedFlag = false;
                //console.log(data);
            });
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



                updateOrdre(ordre['numero'], function (err, data) {


                    if (!err) {
                        //   console.log('update made successfully');
                        //  console.log('data update = '+JSON.stringify(data));
                    }
                    ;



                });
            }

        })
            .catch(err => {
                console.log('error = ' + err);

            });


        await producer.disconnect();


    }
    catch (ex) {
        console.error(`Something bad happened ${ex}`)
    }


}





function updateOrdre(numero, callback) {


    const client = new Client({
        user: dbParams['user'],
        host: dbParams['host'],
        database: dbParams['database'],
        password: dbParams['password'],
        port: dbParams['port']
    });

    var numeroBis , query;
    var numeroAsString = numero.toString();

     
    if(numero.indexOf('/DTT/') > -1 ){

	numeroBis = numero.split('/DTT/');
	query = "UPDATE certificat SET sent = 1 where id_certificat = '" + numeroBis[0] + "'";

    }else{

	query = "UPDATE certificat SET sent = 1 where id_certificat = '" + numero + "'";
    }

    client.connect(err => {

		if(err){
			//console.error('connection error ', err.stack);
			//console.log('not connected '+err.stack);
		}else{
			//console.log('connected');
		}
    });
    
    
	 
    client.query(query, (err, res) => {
        if (err) throw err;

        if (err){
	     
            callback(err, null);
        }else{
	     
            callback(null, res);
	}
        client.end();

    });

    /*     client.connect(function (err) {
            if (err) throw err;
            con.query(query, function (err, result, fields) {
    
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
    
        }); */
}



function getOrdre2(callback) {




    const client = new Client({
        user: dbParams['user'],
        host: dbParams['host'],
        database: dbParams['database'],
        password: dbParams['password'],
        port: dbParams['port'],
    });






    client.connect(err => {

	if(err){
		//console.error('connection error ', err.stack);
		console.log('not connected 2');
	}else{
		console.log('connected 2');
	}
    });


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
    
    WHERE certificat.sent = 0
	limit 10

    `;

    client.query(query, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }

        output = [];
        // properietaire.nom_complet_prop
        var cpt = 0;



        for (let row of res.rows) {



            /* const client_prop = new Client({
                user: 'postgres',
                host: 'localhost',
                database: 'cartegrise',
                password: 'postgres',
                port: 5433,
            });

            client_prop.connect(); */

            //console.log("SELECT nom_complet_prop FROM properietaire WHERE nni = '" + row['nni'] + "'");
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
                proprietaire_query = "SELECT designation FROM pays WHERE id_pays = '" + row['id_pays'] + "'"; // there has to be a query
                flag = "none";
            }

           //console.log("proprietaire_query = " + proprietaire_query);






            //client_prop.query(proprietaire_query, (err, res3) => {
            client.query(proprietaire_query, (err, res3) => {





                if (res3 != null && res3.rows.length > 0) {


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



                //console.log('---->'+JSON.stringify(res3.rows));


                //client_prop.end();


                /* const clientSecondRound = new Client({
                    user: 'postgres',
                    host: 'localhost',
                    database: 'cartegrise',
                    password: 'postgres',
                    port: 5433,
                }); */




                if (row['type_demande_bis'] == "CONVERSION") {

                    row['type_demande'] = "RENOUVELLEMENT CG";

                } else if (row['type_demande_bis'] == "MUTATION" || row['type_demande_bis'] == "CONVERSION_MUTATION") {

                    row['type_demande'] = "MUTATION";
                } if (row['type_demande_bis'] == "NOUVELLE" || row['type_demande_bis'] == "CONVERSION_REGIME" || row['type_demande_bis'] == "CONVERSION_BANALISE")
                    row['type_demande'] = "IMMATRICULATION"
                else if (row['type_demande_bis'] == "DUPLICATA" || row['type_demande_bis'] == "CONVERSION_DUPLICATA" || row['type_demande_bis'] == "CORRECTION") {
                    row['type_demande'] = "DUPLICATA"
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




                //clientSecondRound.connect();




                //clientSecondRound.query(query_genre, (err, res_genre) => {
                client.query(query_genre, (err, res_genre) => {

                    if (err) {
                        console.error(err);
                        return;
                    }

		    //console.log(res_genre.rows[0]);
		    //console.log(query_genre);
                    var res_genre;

		    if(res_genre.rows[0] != undefined ){
			res_genre = res_genre.rows[0]["type"];
		    }else {
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

                     
                     



                    //clientSecondRound.query(query_type_genre, (err, res_type_genre) => {
                    client.query(query_type_genre, (err, res_type_genre) => {



                        if (err) {
                            console.error(err);
                            return;
                        }


                        var resulat = [];
                        var i = 0;



                        if (res_type_genre.rows.length > 0) {

                            if (row['type_demande'] == "IMMATRICULATION") {
                                row['montant'] = res_type_genre.rows[0]['immatriculation'];
                            } else if (row['type_demande'] == "MUTATION") {








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

                                    row['montant'] = row_type_genre['mutation_dans_delai'];
                                }
                            } else if (row['type_demande'] == "RENOUVELLEMENT CG") {
                                row['montant'] = res_type_genre.rows[0]['remplacement'];
                            } else if (row['type_demande'] == "DUPLICATA") {
                                row['montant'] = res_type_genre.rows[0]["deplucata"];
                            }

                            row['cac_ar'] = "إ ن ب";

                            row['cac_fr'] = "DTT";


                            var year = new Date().getFullYear().toString().substr(-2);

                            //row['numero'] = row['numero'] + "/DTT/" + year;
			    row['numero'] = row['numero'].toString();



                            cpt++;



                            row['date_generation'] = new Date();
                            delete row['id_pays'];
                            delete row['id_etablissement'];

                            if (row['date_mutation'] == null) {

                                delete row['date_mutation'];
                            }
                            output.push(row);
                            if (cpt == res.rows.length) {


                                if (err)
                                    callback(err, null);
                                else
                                    callback(null, output);

                                client.end();

                                //console.log(output);
                            }



                        }
                        //clientSecondRound.end();



                    });



                });


















            });

        }


        if (res.rows.length == 0) {


            client.end();
        }



    });





}




async function runConsumer() {
    try {

        const kafka = new Kafka({
            "clientId": kafkaParams['clientId'],
            "brokers": kafkaParams['brokers']
        })

        const consumer = kafka.consumer({ "groupId": kafkaParams['consumerGroupId'] })
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
                console.log(`received data =  ${result.message.value} `);



                var recette = JSON.parse(`${result.message.value}`);

                fs.writeFile('test.txt', JSON.stringify(recette), err => {
                    if (err) {
                      console.error(err)
                      return
                    }
                    //file written successfully
                });




                insertIntoRecettes(recette, function (err, data) {


                    if (err)
                        throw err;
                    else
                        console.log('a row is inserted');

                });



            }
        })

    }
    catch (ex) {
        // console.error(`Something bad happened ${ex}`)
    }
    finally {

    }


}


function insertIntoRecettes(data, callback) {



    const client = new Client({
        user: dbParams['user'],
        host: dbParams['host'],
        database: dbParams['database'],
        password: dbParams['password'],
        port: dbParams['port'],
    });


    /* 
        var datePaiement = data['datePaiement'];
        const myArray = datePaiement.split("-");
     
        var name = recettesFolder + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/' + data['numeroQuittance'] + '.pdf';
    
        
    
        data['path'] = name;
    
        var document = data['quittanceB64'];
       
    
        var dir = recettesFolder + myArray[0] + '/' + myArray[1] + '/' + myArray[2] + '/';
    
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    
        fs.writeFile(name, document, { encoding: 'base64' }, function (err) {
            if (err)
                throw err;
            else
                console.log('File created at emplacement = '+dir);
        });
     */

    client.connect();

    query = "Insert Into  recettes ( date_validation , path ,paiement_en_ligne ,    etat            , date_quittance                , reference                    , serviceBancaire                   , idTransaction                    , Quittance                          , numeroTelephone  , quittance_pdf , numero_recette ) \
                            VALUES (  now()        , 'none'  , 1                 ,  'Reçue'    , '" + data['datePaiement'] + "' ,  '" + data['reference'] + "', '" + data['serviceBancaire'] + "' , '" + data['idTransaction'] + "'  , '" + data['numeroQuittance'] + "'  ,  '" + data['numeroTelephone'] + "' ,  '" + data['quittanceB64'] + "'  , '" + data['ordreRecette']['numero'] + "'    )"

    client.query(query, (err, res) => {
        if (err) throw err;

        if (err)
            callback(err, null);
        else
            callback(null, res);

        client.end();

    });



};


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
