 
const mongoose = require('mongoose');

 
 


const personnesSchema = mongoose.Schema({
 
   
    _id: mongoose.Schema.Types.ObjectId,

    nni: String,
    prenomAr: String,
    prenomFr: String,
    perePrenomAr: String,
    perePrenomFr: String,
    patronymeAr: String,
    patronymeFr: String,
    sexeCode: String,
    dateNaissance: Date,
    lieuNaissanceAr: String,
    lieuNaissanceFr: String,
    nationalities: [String],
    typePersonne: String,
    status: String // valid


});


module.exports = mongoose.model('personnes', personnesSchema , 'personnes');


// {
//     numero: '060401511120006',
//     nni: '3337510817',
//     prenomFr: 'Aichetou',
//     prenomAr: '',
//     nomFamilleFr: 'Ramdhane', // patronymeFr
//     nomFamilleAr: '', // patronymeAr
//     dateNaissance: '11/08/1999', 
//     lieuNaissanceFr: "Tekane", // lieuNaissanceFr
//     lieuNaissanceAr: '' // lieuNaissanceAr
//     montant: 100,
//     typeDemande: 'Saturé' // typeDem
//     typeDocument: 'Passport standard' // typeDoc
//     cacFr: "Jeddah" // nomCentreFr
//     cacAr: ""   // nomCentreAr
 
// }