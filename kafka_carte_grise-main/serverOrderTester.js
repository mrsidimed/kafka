// testPublishOrder.js
//
// Quick sanity-check for the /publishOrder endpoint.
// 1. Start your API server (node index.js).
// 2. Run:  node testPublishOrder.js
//

const axios = require('axios');

// A realistic-looking order payload -----------------------------------------
const ordre = {
  numero:        `TEST-${Date.now()}`,         // unique each run
  vin:           'ABC123XYZ9876543',
  marque:        'TOYOTA',
  type:          'Corolla',
  genre:         'VP',
  puissance_fiscal: 10,
  matricule:     '1234-AA-25',
  charge_utile:  600,
  proprietaire:  'John Doe',
  typeDemande:   'IMMATRICULATION',
  montant:       12345,
  date_generation: new Date().toISOString()
};

// Fire the request -----------------------------------------------------------
(async () => {
  try {
    const res = await axios.post(
      'http://localhost:3001/publishOrder',
      ordre,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Success path
    console.log('✅  Server responded with:', res.status, res.statusText);
    console.dir(res.data, { depth: null });
  } catch (err) {
    // Network errors or non-2xx responses
    if (err.response) {
      console.error(`❌  ${err.response.status} ${err.response.statusText}`);
      console.dir(err.response.data, { depth: null });
    } else {
      console.error('❌  Request failed:', err.message);
    }
    process.exit(1);
  }
})();
