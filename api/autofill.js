export default async function handler(req, res) {
  // CORS Headers
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
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Fetch page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();

    // Extract Basic Info from Meta Tags
    const getMeta = (prop) => {
      const match = html.match(new RegExp(`<meta\\s+(?:property|name)="${prop}"\\s+content="([^"]*)"`, 'i'));
      return match ? match[1] : '';
    };

    const title = getMeta('og:title') || getMeta('twitter:title') || 'Product Name';
    const image = getMeta('og:image') || getMeta('twitter:image') || '';
    const description = getMeta('og:description') || getMeta('description') || '';

    // Extract Price
    let price = '499';
    const priceMatch = html.match(/₹\s?(\d+)/) || html.match(/"price":\s?(\d+)/);
    if (priceMatch) {
      price = priceMatch[1];
    }

    const mrp = Math.round(parseFloat(price) * 1.3).toString();

    const resultData = {
      name: title,
      title: title,
      price: price,
      mrp: mrp,
      shippedFrom: "India",
      description: description || "Product details extracted.",
      image: image
    };

    return res.status(200).json({
      choices: [{
        message: {
          content: JSON.stringify(resultData)
        }
      }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to process URL" });
  }
}
