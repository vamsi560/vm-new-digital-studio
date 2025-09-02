import EnhancedAPI from './enhanced-api.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create and start the enhanced API
const api = new EnhancedAPI();
api.start();
