const mongoose = require('mongoose');

 
 


const ordersRecettesSchema = mongoose.Schema({
 
   
    _id: mongoose.Schema.Types.ObjectId,
    numero: String,
    dateOrdre: String,
    codeCac: String,
    typeDoc: String,
    typeDem: String,
    montant: Number,
    nni: String,
    transport: Number,
    devise: String,
    acquite: Boolean,
    reprise: Number,
    nRecette: String,
    sent: Boolean,



    
    reference: String,
    serviceBancaire: String,
    idTransaction: String,
    datePaiement: String,
    numeroQuittance: String,
    numeroTelephone: String,
    quittanceB64: String



});

module.exports = mongoose.model('ordersRecettes', ordersRecettesSchema , 'ordersRecettes');




// data['ordreRecette'] = {
//     'numero': '060401511120007'
    
// }
// data['reference'] = 'myreference';
// data['serviceBancaire'] = 'myserviceBancaire';
// data['idTransaction'] = 'myidTransaction';
// data['datePaiement'] = '2020-04-17';
// //data['quittance']['quittanceNo'] =  ''+getRandomNumberBetween(0,1000000);

// data['quittance'] = {
//     'quittanceNo': ''+getRandomNumberBetween(0,1000000)
// }
// data['numeroTelephone'] = '36055868';
// data['quittanceB64'] = 'base64Image';
