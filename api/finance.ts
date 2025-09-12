// api/finance.ts
// This function acts as a server-side proxy to the Alpha Vantage API.
export default async (req, res) => {
  const { avFunction, symbol } = req.query;
  // IMPORTANT: The API key MUST be configured as an environment variable in your Vercel project.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  if (!avFunction || !symbol) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Invalid request. Missing "avFunction" or "symbol" parameter.' });
  }

  const BASE_URL = 'https://www.alphavantage.co/query';
  const url = `${BASE_URL}?function=${avFunction}&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const apiResponse = await fetch(url, {
      headers: { 'User-Agent': 'Vercel-Serverless-Function' }
    });
    
    const data = await apiResponse.json();

    if (!apiResponse.ok || data['Error Message']) {
       console.error(`Alpha Vantage API Error for symbol ${symbol}:`, data);
       const errorMessage = data['Error Message'] || `Failed to fetch from Alpha Vantage. Status: ${apiResponse.status}`;
       res.setHeader('Content-Type', 'application/json');
       return res.status(apiResponse.status).json({ error: errorMessage });
    }
    
    // Set short caching headers to respect real-time data while providing some performance benefits.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy internal error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal Server Error in proxy.', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
