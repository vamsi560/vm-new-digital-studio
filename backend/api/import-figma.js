import axios from 'axios';

function extractFileKey(figmaUrl) {
  // Support both https://www.figma.com/file/<key>/... and https://www.figma.com/design/<key>/...
  const match = figmaUrl.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)\//);
  return match ? match[2] : null;
}

export default async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    if (!figmaUrl) return res.status(400).json({ error: 'No figmaUrl provided.' });
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) return res.status(400).json({ error: 'Invalid Figma URL.' });

    const token = "figd_00LP2oP9Fqfd0PY0alm9L9tsjlC85pn8m5KEeXMn";
    if (!token) {
      return res.status(400).json({
        error: 'FIGMA_API_TOKEN is not configured on the server. Please set it in backend/.env and restart the server.'
      });
    }

    const headers = {
      'X-Figma-Token': token,
      'User-Agent': 'vm-digital-studio/1.0',
      'Accept': 'application/json'
    };

    // 1. Get file nodes (document structure)
    const fileResp = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, { headers });
    const document = fileResp.data.document;
    // Find all top-level frames (pages > children)
    let frames = [];
    for (const page of document.children) {
      if (page.children) {
        for (const node of page.children) {
          if (node.type === 'FRAME') {
            frames.push({ id: node.id, name: node.name });
          }
        }
      }
    }
    if (frames.length === 0) return res.status(404).json({ error: 'No frames found in Figma file.' });

    // 2. Get image URLs for all frames
    const ids = frames.map(f => f.id).join(',');
    const imagesResp = await axios.get(`https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png`, { headers });
    const images = imagesResp.data.images || {};

    // 3. Download each image and encode as base64
    const results = await Promise.all(frames.map(async (frame) => {
      const imageUrl = images[frame.id];
      if (!imageUrl) return null;
      try {
        const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const mimeType = imgResp.headers['content-type'] || 'image/png';
        const data = Buffer.from(imgResp.data, 'binary').toString('base64');
        return {
          fileName: `${frame.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`,
          data,
          mimeType
        };
      } catch (imgErr) {
        // Return a placeholder entry indicating a failed frame download
        return {
          fileName: `${frame.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`,
          error: true,
          message: `Failed to download image for frame ${frame.name}`
        };
      }
    }));

    // Filter out any null results from failed URL resolution
    const successfulResults = results.filter(Boolean);
    if (successfulResults.length === 0) {
      return res.status(502).json({ error: 'Could not download any images from Figma.' });
    }

    res.status(200).json(successfulResults);

  } catch (err) {
    // Normalize error to JSON always
    const status = err.response?.status || 500;
    let figmaResponse = err.response?.data;
    if (typeof figmaResponse !== 'object') {
      figmaResponse = String(figmaResponse || err.message || 'Unknown error');
    }
    res.status(status).json({
      error: 'Figma import failed',
      details: figmaResponse
    });
  }
};
