const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'cartegrise',
    password: 'postgres',
    port: 5433,
});




/*
Notes:

- for the inner joins to work all the foreign key and primary keys should be != null which is not the case for id_certificat=689
- there are some genre that were not considered in the algorithm like 'genre: 'CAR',' for id_certificat=689
- date_vente de la table certificat est toujours null , format?
- que faire avec le retour.

- mettre les parametre de base de donnees et de kafka dans un fichier externe parametrable.
*/


/*
Notes:

- what to do if date_mutation = null and  prendre hors delai or dans_delai

*/




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
 --       properietaire.nom_complet_prop as proprietaire, 

        
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


query2 = "select * from certificat where sent = 0"; 

/* client.query(query, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(res.rows);

    if(res.rows.length==0){
        client.end();
    }

    for (let row of res.rows) {
         

        if (row['type_demande_bis'] == "CONVERSION") {

            row['type_demande'] = "RENOUVELLEMENT CG";

        } else if (row['type_demande_bis'] == "MUTATION" || row['type_demande_bis'] == "CONVERSION_MUTATION") {

            row['type_demande'] = "MUTATION";
        } if (row['type_demande_bis'] == "NOUVELLE" || row['type_demande_bis'] == "CONVERSION_REGIME" || row['type_demande_bis'] == "CONVERSION_BANALISE")
            row['type_demande'] = "IMMATRICULATION"
        else if (row['type_demande_bis'] == "DUPLICATA" || row['type_demande_bis'] == "CONVERSION_DUPLICATA" || row['type_demande_bis'] == "CORRECTION"){
            row['type_demande'] = "DUPLICATA"
        }

        var poids_charge = parseFloat(row["poids_charge"]);
        var poids_vide = parseFloat(row["poids_vide"]);

        var charge_utile = poids_charge - poids_vide;

        row['charge_utile'] = charge_utile;


        delete row['poids_charge'];
        delete row['poids_vide'];
        delete row['type_demande_bis'];

        

        var query_type_genre ='';
        if(row['genre']== 'VP'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"' and nb_place_max >='"+row['nombre_places']+"'  and  nb_place_min <='"+row['nombre_places']+"'";
        }else if(row['genre']== 'UT'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"' and poid_max >='"+row['charge_utile']+"'  and  poid_min <='"+row['charge_utile']+"'";
        }else if(row['genre']== 'TT'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"'";
        }
        
        
         console.log('0000-----');

        client.query(query_type_genre, (err, res_type_genre) => {


            if (err) {
                console.error(err);
                return;
            }

            
            var resulat =[]; 
            var i = 0;
            for (let row_type_genre of res_type_genre.rows) {
               // console.log(row_type_genre);
                    
             

                    if(row['type_demande']=="IMMATRICULATION"){
                        row['montant']=row_type_genre['immatriculation'];
                    }else if( row['type_demande']=="MUTATION"){
                        //if(now-dateMutation>3mois){
                        if(row['type_mutation']==null){
                            row['montant']  = row_type_genre['mutation_hors_delai']
                        }
                        else{
                            row['montant'] = row_type_genre['mutation_dans_delai']
                        }
                    }else if( row['type_demande']=="RENOUVELLEMENT CG"){
                        row['montant'] = row_type_genre['remplacement']; 
                    }else if(row['type_demande']=="DUPLICATA"){
                        row['montant'] =row_type_genre["deplucata"];
                    }

                    row['cac_ar'] = "إ ن ب"; 

                    row['cac_fr'] = "DTT";

                     
                    var year =new Date().getFullYear().toString().substr(-2);
                  
                    row['numero'] = row['numero']+"/DTT/"+year;

                   // console.log(row);
                   resulat.push(row);
                    
            }
             
            console.log('------');

            console.log(resulat);

            

            
            i++;

            

        });

        console.log('0000');
         






    }
    
    
}); */



client
  .query(query)
  .then(res => {
 
    //console.log(res.rows);
    output = [];

    

    var cpt =0;
    for (let row of res.rows) {

        
        const clientSecondRound = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'cartegrise',
            password: 'postgres',
            port: 5433,
        });
         

        if (row['type_demande_bis'] == "CONVERSION") {

            row['type_demande'] = "RENOUVELLEMENT CG";

        } else if (row['type_demande_bis'] == "MUTATION" || row['type_demande_bis'] == "CONVERSION_MUTATION") {

            row['type_demande'] = "MUTATION";
        } if (row['type_demande_bis'] == "NOUVELLE" || row['type_demande_bis'] == "CONVERSION_REGIME" || row['type_demande_bis'] == "CONVERSION_BANALISE")
            row['type_demande'] = "IMMATRICULATION"
        else if (row['type_demande_bis'] == "DUPLICATA" || row['type_demande_bis'] == "CONVERSION_DUPLICATA" || row['type_demande_bis'] == "CORRECTION"){
            row['type_demande'] = "DUPLICATA"
        }

        var poids_charge = parseFloat(row["poids_charge"]);
        var poids_vide = parseFloat(row["poids_vide"]);

        var charge_utile = poids_charge - poids_vide;

        row['charge_utile'] = charge_utile;


        delete row['poids_charge'];
        delete row['poids_vide'];
        delete row['type_demande_bis'];

        
        

        var query_type_genre ='';
        if(row['genre']== 'VP'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"' and nb_place_max >="+parseFloat(row['nombre_places'])+"  and  nb_place_min <="+parseFloat(row['nombre_places'])+"";
        }else if(row['genre']== 'UT'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"' and poid_max >="+parseFloat(row['charge_utile'])+"  and  poid_min <="+parseFloat(row['charge_utile'])+"";
        }else if(row['genre']== 'TT'){
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"'";
        }else{
            query_type_genre = "SELECT  *  FROM    type_genre  WHERE type = '"+row['genre']+"'";
            // this case because there are cases that are not considered
        }
        

        
        
         
        clientSecondRound.connect();

        clientSecondRound.query(query_type_genre, (err, res_type_genre) => {

           

            if (err) {
                console.error(err);
                return;
            }

            
            var resulat =[]; 
            var i = 0;

             
           
             
            if(res_type_genre.rows.length>0){

                    if(row['type_demande']=="IMMATRICULATION"){
                        row['montant']=res_type_genre.rows[0]['immatriculation'];
                    }else if( row['type_demande']=="MUTATION"){
                        //if(now-dateMutation>3mois){
                        if(row['type_mutation']==null){
                            row['montant']  = res_type_genre.rows[0]['mutation_hors_delai']
                        }
                        else{
                            row['montant'] =res_type_genre.rows[0]['mutation_dans_delai']
                        }
                    }else if( row['type_demande']=="RENOUVELLEMENT CG"){
                        row['montant'] = res_type_genre.rows[0]['remplacement']; 
                    }else if(row['type_demande']=="DUPLICATA"){
                        row['montant'] =res_type_genre.rows[0]["deplucata"];
                    }

                    row['cac_ar'] = "إ ن ب"; 

                    row['cac_fr'] = "DTT";

                     
                    var year =new Date().getFullYear().toString().substr(-2);
                  
                    row['numero'] = row['numero']+"/DTT/"+year;

                    //console.log(row);
                   
                    cpt++;

        
                   output.push(row);
                   if(cpt == res.rows.length ){
                     
                    console.log(output);
                   }
                   

            
            }
            clientSecondRound.end();

        });

    }

    
    client.end();

  }).then(() => {

   
    
})
  .catch(e => console.error(e.stack))
  