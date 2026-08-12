
export default async function handler(req, res) {
  // CORS ഹെഡറുകൾ സെറ്റ് ചെയ്യുക (ബ്രൗസർ ബ്ലോക്ക് ചെയ്യാതിരിക്കാൻ)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // തൽക്കാലത്തേക്ക് ടെസ്റ്റ് ചെയ്യാൻ ഡമ്മി ഡാറ്റ നൽകിയിരിക്കുന്നു.
    // നിങ്ങൾക്ക് വേണമെങ്കിൽ ഇവിടെ വെബ് സ്ക്രാപ്പിംഗ് ലോജിക് അല്ലെങ്കിൽ AI API കോഡ് എഴുതാം.
    const mockExtractedData = {
      name: "Sample Product from Link",
      title: "Extracted Product Title",
      price: "499",
      mrp: "999",
      shippedFrom: "India",
      description: "• High quality product\n• Durable material",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    };

    return res.status(200).json({
      choices: [{
        message: {
          content: JSON.stringify(mockExtractedData)
        }
      }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
