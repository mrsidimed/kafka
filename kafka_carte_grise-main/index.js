var mysql = require('mysql');

const { Client } = require('pg');

const dbParams = require('./dbParametersProd.json');




getOrdre2(function (err, data) {


    console.log("data.length = "+data.length);
    if (data.length > 0) {

        for (var i = 0; i < data.length; i++) {

            //runProducer(data[i]);
            console.log(data[i]);

        }

    } else {
        console.log('waiting for new orders');
    }
    console.log("data.length = "+ data.length);
    //console.log(data);
});

function getOrdre2(callback) {




    const client = new Client({
        user: dbParams['user'],
        host: dbParams['host'],
        database: dbParams['database'],
        password: dbParams['password'],
        port: dbParams['port'],
    });






    client.connect();


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

                console.log("proprietaire_query = "+proprietaire_query);

                delete row['nni'];


            } else {
                proprietaire_query = "SELECT designation FROM pays WHERE id_pays = '" + row['id_pays'] + "'"; // there has to be a query
                flag = "none";
            }

            console.log("proprietaire_query = "+proprietaire_query);

            




            //client_prop.query(proprietaire_query, (err, res3) => {
            client.query(proprietaire_query, (err, res3) => {





                if (res3 != null && res3.rows.length > 0) {


                    console.log("res3.rows[0] = "+res3.rows[0]);

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
                    res_genre = res_genre.rows[0]["type"];


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

                    console.log('-------------------------------->'+res_genre);
                    console.log('--------------------------------> query_type_genre = '+query_type_genre);



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

                            row['numero'] = row['numero'] + "/DTT/" + year;



                            cpt++;



                            row['date_generation'] = new Date();
                            delete row['id_pays'];
                            delete row['id_etablissement'];

                            if( row['date_mutation']==null){

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