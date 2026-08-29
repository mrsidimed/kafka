var recette = {
  createdAt: "2024-10-09T10:56:49.856564",
  datePaiement: "2024-10-09T10:56:50.546273",
  id: 1331320,
  idTransaction: "0424100910564681223",
  isConsumed: null,
  numeroQuittance: null,
  numeroTelephone: "36055868",
  ordreRecette: {
    cacAr: "هويتي",
    cacFr: "Houwiyeti",
    createdAt: "2024-10-09T10:56:24.795913",
    dateGeneration: "2024-10-09T10:56:24.795786",
    dateNaissance: "1990-12-31T00:00:00.000Z",
    id: 1331300,
    lieuNaissanceAr: "????",
    lieuNaissanceFr: "Atar",

    // "montant": 20,
    amount: 20,

    nni: "4949612793",
    nomFamilleAr: "???????",
    nomFamilleFr: "Lahwerthi",

    // "numero": "900091468210833",
    receiptOrderNumber: "ANR" + "000202511120013",

    prenomAr: "??? ????",
    prenomFr: "Sidi Mohamed",
    typeDemande: "Première demande",

    // "typeDocument": "6-Passeport standard",
    receiptType: "6-Passeport standard",

    updatedAt: "2024-10-09T10:56:24.795914",
  },

  quittance: {
    amount: 20,
    createdAt: "2024-10-09T10:56:49.955593",
    deliveredBy: null,
    id: 1331321,
    info1: "Sidi Mohamed Lahwerthi",
    info2: "4949612793",
    info3: "36055868",
    isConsumed: null,
    nature: null,
    paymentMode: null,
    pdfId: "2a52e0e6-795d-4881-b5c6-5b1d9c36ecc1",
    quittanceNo: "2024T00002198142",
    quittanceOwner: null,
    quittanceType: "9-Extrait",
  },
  quittanceB64: null,
  reference: "677da33c-87a8-4b0d-a168-0ee405fb8d5a",
  serviceBancaire: "BANKILY",
  status: "finished",
  updatedAt: "2024-10-09T10:56:49.955805",
}; // Create a new recette object

function renameOrdreRecetteFields(data) {
  // adias are imposing a new format for the data

  data.ordreRecette.numero = data.ordreRecette.receiptOrderNumber;
  if (typeof data.ordreRecette.numero === "string") {
    data.ordreRecette.numero = data.ordreRecette.numero.replace(/^ANR/, "");
  }
  delete data.ordreRecette.receiptOrderNumber;

  data.ordreRecette.montant = data.ordreRecette.amount;
  delete data.ordreRecette.amount;

  data.ordreRecette.typeDocument = data.ordreRecette.receiptType;
  delete data.ordreRecette.receiptType;

  return data;
}


console.log(recette);
recetteModif = renameOrdreRecetteFields( recette);  
console.log(recetteModif);