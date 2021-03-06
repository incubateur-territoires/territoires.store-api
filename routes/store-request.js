var express = require('express');
var router = express.Router();

// {
//   contact: {
//     collectivite: 'Wat',
//     civilite: 'M',
//     nom: 'P',
//     prenom: 'J',
//     fonction: 'élu',
//     email: 'jonathan@pichot.us'
//   },
//   investigation: false,
//   services: [
//     {
//       service: 'CoMobi',
//       action: 'Créer une plateforme de covoiturage pour mon territoire en montagne ou en zone rurale',
//       url: 'https://neutre.comobi.fr/',
//       contact: 'equipe@comobi.fr',
//       thematique: [Array],
//       fileInfo: [Object]
//     }
//   ]
// }

/* POST new Territoires Store request. */
router.post('/', async function(req, res, next) {
  const request = req.body;

  // Send emails
  const SibApiV3Sdk = require('sib-api-v3-sdk');
  const sibClient = SibApiV3Sdk.ApiClient.instance;

  // Configure API key authorization: api-key
  const sibApiKey = sibClient.authentications['api-key'];
  sibApiKey.apiKey = process.env.SIB_API_KEY;

  const sibApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  // Send incubateur  email
  let incubateurEmail = new SibApiV3Sdk.SendSmtpEmail(); 
  incubateurEmail = {
    to: process.env.EMAIL_INVESTIGATIONS.split(',').map((email) => { return {email} }),
    templateId: 2,
    params: {
      nom: request.contact.nom,
      email: request.contact.email,
      tel: request.contact.tel,
      contact: request.contact,
      services: request.services,
      investigation: request.investigation
    }
  };
  const incubateurEmailResponse = await sibApiInstance.sendTransacEmail(incubateurEmail);
  
  // Send emails to biz devs
  if (request.services.length > 0) {
    request.services.forEach(service => {
      var bizDevEmail = new SibApiV3Sdk.SendSmtpEmail(); 
      
      bizDevEmail = {
        to: request.contact.email.split(',').map((email) => { return {email} }),
        replyTo: service.contact.split(',').map((email) => { return {email} })[0],
        cc: service.contact.split(',').map((email) => { return {email} }),
        subject: `[Territoires Store] ${service.service}`,
        templateId: 3,
        params: {
          contact: request.contact,
          service: service.service
        }
      };

      sibApiInstance.sendTransacEmail(bizDevEmail);
    });
  }
  
  // Send confirmation email
  // let confirmationEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email
  // confirmationEmail = {
  //   to: [{
  //     email: request.contact.email,
  //     name: request.contact.nom
  //   }],
  //   templateId: 1
  // };
  // const confirmationEmailResponse = await sibApiInstance.sendTransacEmail(confirmationEmail);

  // At row to Airtable
  // const Airtable = require('airtable')
  // const base = new Airtable({apiKey: process.env.AIRTABLE_KEY}).base(process.env.AIRTABLE_BASE)

  // const airtableResponse = await base('[Territoires Store]').create({
  //     "Nom": request.contact.nom,
  //     "Email": request.contact.email,
  //     "Telephone": request.contact.tel,
  //     "Services": request.services.map(s => s.service),
  //     "Investigation": request.investigation
  //   }, 
  //   {typecast: true}
  // );

  res.json({ok:true});
});

module.exports = router;
