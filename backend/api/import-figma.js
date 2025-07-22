import axios from 'axios';

function extractFileKey(figmaUrl) {
  // Figma file URLs look like: https://www.figma.com/file/<fileKey>/...
  const match = figmaUrl.match(/figma.com\/file\/([a-zA-Z0-9]+)\//);
  return match ? match[1] : null;
}

module.exports = async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    if (!figmaUrl) return res.status(400).json({ error: 'No figmaUrl provided.' });
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) return res.status(400).json({ error: 'Invalid Figma URL.' });

    const token = process.env.FIGMA_API_TOKEN;
    const headers = token ? { 'X-Figma-Token': token } : {};

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
    const images = imagesResp.data.images;

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
        console.error(`Failed to download image for frame ${frame.name}:`, imgErr.message);
        // Silently ignore frames that fail to download, or you could return an error indicator
        return null;
      }
    }));

    // Filter out any null results from failed downloads
    const successfulResults = results.filter(Boolean);
    if (successfulResults.length === 0) {
      return res.status(500).json({ error: 'Could not download any images from Figma.' });
    }

    res.status(200).json(successfulResults);

  } catch (err) {
    console.error('Error in /api/import-figma:', err.response ? err.response.data : err.message);
    const status = err.response ? err.response.status : 500;
    const message = err.response ? err.response.data.err || 'Failed to import from Figma' : 'Internal Server Error';
    res.status(status).json({ error: message, details: err.message });
  }
};
