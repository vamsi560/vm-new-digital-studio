// 📁 File: api/status.js

module.exports = async (req, res) => {
  try {
    res.status(200).json({
      service: "VM Digital Studio API",
      status: "🟢 Healthy",
      uptime: process.uptime().toFixed(2) + 's',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: "🔴 Unhealthy", error: err?.message });
  }
};
