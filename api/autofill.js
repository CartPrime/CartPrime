export default async function handler(req, res) {
  // CORS Headers (ഫ്രണ്ട്എൻഡിൽ ബ്ലോക്ക് ചെയ്യാതിരിക്കാൻ)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    // Meesho Link ഫെച്ച് ചെയ്യുന്നു (Real Browser ആണെന്ന് തോന്നിപ്പിക്കാൻ User-Agent ചേർക്കുന്നു)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Meesho പേജിലെ സ്രോതസ്സുകളിൽ നിന്ന് JSON ഡാറ്റ തിരയുന്നു
    let extractedData = {
      name: "",
      title: "",
      price: "",
      mrp: "",
      shippedFrom: "India",
      description: "",
      image: ""
    };

    // 1. OpenGraph Meta Tags വഴി ഡാറ്റ എടുക്കുന്നു
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/i);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/i);

    if (titleMatch) extractedData.name = titleMatch[1];
    if (titleMatch) extractedData.title = titleMatch[1];
    if (imageMatch) extractedData.image = imageMatch[1];
    if (descMatch) extractedData.description = descMatch[1];

    // 2. Meesho-യുടെ കൂട്ടത്തിൽ നിന്ന് വില (Price) കണ്ടുപിടിക്കുന്നു
    const priceMatch = html.match(/₹\s?(\d+)/) || html.match(/"price":\s?(\d+)/);
    if (priceMatch) {
      const priceNum = parseInt(priceMatch[1]);
      extractedData.price = priceNum.toString();
      extractedData.mrp = Math.round(priceNum * 1.3).toString(); // 30% കൂട്ടിയ MRP
    }

    // ഫ്രണ്ട്എൻഡിന് ആവശ്യമായ ഫോർമാറ്റിലേക്ക് ഡാറ്റ റിട്ടേൺ ചെയ്യുന്നു
    return res.status(200).json({
      choices: [{
        message: {
          content: JSON.stringify(extractedData)
        }
      }]
    });

  } catch (error) {
    console.error("Scraping Error:", error);
    return res.status(500).json({ error: "Failed to fetch product details from Meesho link" });
  }
}
