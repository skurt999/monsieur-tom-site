export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prenom, societe, email, telephone, type, message } = req.body;

  if (!prenom || !societe || !email) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
  const headers = {
    'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Créer ou mettre à jour le contact HubSpot
    const [firstName, ...lastParts] = prenom.trim().split(' ');
    const lastName = lastParts.join(' ') || societe;

    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone: telephone || '',
          company: societe,
          hs_lead_status: 'NEW',
        }
      })
    });

    let contactId;
    if (contactRes.ok) {
      const contact = await contactRes.json();
      contactId = contact.id;
    } else {
      // Contact existe déjà — on le retrouve par email
      const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
        })
      });
      const searchData = await searchRes.json();
      contactId = searchData.results?.[0]?.id;
    }

    // 2. Créer le deal
    const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `${societe} — ${type || 'Demande site web'}`,
          pipeline: 'default',
          dealstage: 'appointmentscheduled',
          amount: '',
          description: message || '',
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      })
    });

    const deal = await dealRes.json();
    const dealId = deal.id;

    // 3. Associer contact → deal
    if (contactId && dealId) {
      await fetch(`https://api.hubapi.com/crm/v4/objects/contacts/${contactId}/associations/deals/${dealId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 4 }])
      });
    }

    return res.status(200).json({ success: true, contactId, dealId });

  } catch (err) {
    console.error('HubSpot error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
