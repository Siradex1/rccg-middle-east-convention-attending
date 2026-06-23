export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.REMOVE_BG_API_KEY) {
    return res.status(500).json({ error: 'REMOVE_BG_API_KEY is missing in Vercel Environment Variables.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || !body.imageData || !body.imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'No image data received.' });
    }

    const match = body.imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format.' });
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    const form = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    form.append('image_file', blob, 'photo.jpg');
    form.append('size', 'auto');
    form.append('format', 'png');

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
      body: form
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({
        error: `remove.bg error: ${errorText.slice(0, 300)}`
      });
    }

    const arrayBuffer = await apiResponse.arrayBuffer();
    const output = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({
      imageData: `data:image/png;base64,${output}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || 'Server background removal failed.'
    });
  }
}
