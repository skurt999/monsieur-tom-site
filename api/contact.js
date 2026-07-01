export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const prenom = (body.prenom || '').trim();
  const societe = (body.societe || '').trim();
  const email = (body.email || '').trim();
  const telephone = (body.telephone || '').trim();
  const type = (body.type || '').trim();
  const message = (body.message || '').trim();

  // Honeypot anti-spam : champ invisible pour les humains, rempli par les bots
  if (body.website) return res.status(200).json({ success: true });

  if (!prenom || !societe || !email) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_TOKEN) {
    console.error('HUBSPOT_API_KEY manquant dans les variables d\'environnement Vercel');
    return res.status(500).json({ error: 'Configuration serveur incomplète' });
  }

  const headers = {
    'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Créer ou mettre à jour le contact HubSpot
    const [firstName, ...lastParts] = prenom.split(' ');
    const lastName = lastParts.join(' ') || societe;

    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone: telephone,
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
          description: message,
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      })
    });

    if (!dealRes.ok) {
      console.error('HubSpot deal error:', dealRes.status, await dealRes.text());
      return res.status(502).json({ error: 'Erreur HubSpot' });
    }
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
