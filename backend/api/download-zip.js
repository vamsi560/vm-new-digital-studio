// 📁 api/download-zip.js

import JSZip from 'jszip';

module.exports = async (req, res) => {
  try {
    const { files, project = 'generated-project' } = req.body;
    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid files payload.' });
    }

    const zip = new JSZip();
    Object.keys(files).forEach((path) => {
      zip.file(path, files[path]);
    });

    const content = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Disposition', `attachment; filename=${project}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.status(200).send(content);
  } catch (err) {
    console.error('Error creating zip:', err);
    res.status(500).json({ error: 'Failed to generate zip.' });
  }
};
