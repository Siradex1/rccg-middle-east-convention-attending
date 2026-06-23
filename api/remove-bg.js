module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  if (!process.env.REMOVE_BG_API_KEY) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'REMOVE_BG_API_KEY is missing in Vercel Environment Variables.' }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const body = JSON.parse(raw);

    if (!body.imageData || !body.imageData.startsWith('data:image/')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No image data received.' }));
      return;
    }

    const match = body.imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid image format.' }));
      return;
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
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY
      },
      body: form
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      res.statusCode = apiResponse.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `remove.bg error: ${errorText.slice(0, 300)}` }));
      return;
    }

    const arrayBuffer = await apiResponse.arrayBuffer();
    const output = Buffer.from(arrayBuffer).toString('base64');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ imageData: `data:image/png;base64,${output}` }));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server background removal failed. Check Vercel logs.' }));
  }
};
