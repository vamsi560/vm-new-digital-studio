// Simplified Preview Config API
export default async function handler(req, res) {
  try {
    return res.json({
      success: true,
      message: 'Preview configuration functionality',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 