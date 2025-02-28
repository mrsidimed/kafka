const mongoose = require('mongoose');
const { Schema } = mongoose;

const geoLocationSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number], // Array of numbers for coordinates
    required: true,
  },
});

const cacSchema = new Schema({
  codeCentre: { type: String, required: true },
  nomCentreFr: { type: String, required: true },
  nomCentreAr: { type: String, required: true },
  location: { type: geoLocationSchema, required: false },
}, {
  collection: 'cacs',
});


module.exports = mongoose.model('cacs', cacsSchema , 'cacs');

 