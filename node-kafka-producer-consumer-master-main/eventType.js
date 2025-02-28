import avro from 'avsc';

export default avro.Type.forSchema({
  type: 'record',
  fields: [
/*     {
      name: 'factureNumero',
      type: 'int'
    },
    {
      name: 'facturePaye',
      type: 'boolean'
    }, */
    {
      name: 'NUMERO',
      type: 'string'
    },
    /* 
    {
      name: 'DATEORDRE',
      type: 'string'
    },
    {
      name: 'CODECAC',
      type: 'string'
    },
    {
      name: 'LOGIN',
      type: 'string'
    }, */
    {
      name: 'NNI',
      type: 'string'
    },
    {
      name: 'MONTANT',
      type: 'int'
    },
    {
      name: 'PRENOM_FR',
      type: 'string'
    },
    {
      name: 'NOM_FAMILLE_FR',
      type: 'string'
    },

  ]
});


 