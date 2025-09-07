// server.js
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes.js';
import { requireApiKey } from './auth.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(requireApiKey); // API key middleware

// Mount the routes
app.use('/', routes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
