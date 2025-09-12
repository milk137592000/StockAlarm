// This function acts as a server-side proxy to the Yahoo Finance API
// to bypass CORS issues that occur when calling from the browser.
export default async (req, res) => {
  const { endpoint, symbol, symbols } = req.query;

  let targetUrl: string;

  if (endpoint === 'quote' && symbols) {
    targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  } else if (endpoint === 'chart' && symbol) {
    // Fetches enough historical data for indicator calculations
    targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`;
  } else {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Invalid request. Please provide a valid endpoint and parameters.' });
  }

  try {
    const apiResponse = await fetch(targetUrl, {
      headers: {
        // Some APIs block requests without a User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const responseBody = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error(`Yahoo API Error (${apiResponse.status}):`, responseBody);
      res.setHeader('Content-Type', 'application/json');
      return res.status(apiResponse.status).json({ 
        error: `Failed to fetch from Yahoo Finance API. Status: ${apiResponse.status}`,
        details: responseBody
      });
    }

    // Set appropriate caching headers. Vercel's Edge Network will cache these responses.
    if (endpoint === 'quote') {
      res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    } else if (endpoint === 'chart') {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    }
    
    // Pass through the original content type
    res.setHeader('Content-Type', apiResponse.headers.get('content-type') || 'application/json');
    res.status(200).send(responseBody);

  } catch (error) {
    console.error('Proxy internal error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal Server Error in proxy.', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
