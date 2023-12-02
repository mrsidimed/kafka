import avro from 'avsc';

export default avro.Type.forSchema({








  type: 'record',
 
  fields: [
    {
        name: 'factureNumero',
        type: 'string',
    },
    {
      name: 'facturePayee',
      type: 'string',
    }
  ]
});