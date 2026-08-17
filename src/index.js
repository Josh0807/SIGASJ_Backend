import { createApp } from './app.js';
import { config } from './shared/config.js';
import { seedDatabase } from './shared/db.js';

seedDatabase();

const app = createApp();

app.listen(config.port, () => {
  console.log(`SIGASJ API escuchando en http://localhost:${config.port}`);
});
