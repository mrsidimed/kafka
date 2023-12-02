// Connect to the MongoDB server
db = connect("mongodb://root:password@localhost:27017/anrpts");

// Create the 'ordersRecettes' collection and insert sample data
db.ordersRecettes.insert({
    numero: "001",
    dateOrdre: new Date().toISOString(),
    codeCac: "CAC101",
    typeDoc: "DOC-A",
    typeDem: "DEM-1",
    montant: 1000,
    nni: "NNI12345",
    transport: 50,
    devise: "USD",
    acquite: false,
    reprise: 5,
    nRecette: "REC123",
    sent: false
});

print('Database initialization completed.');
