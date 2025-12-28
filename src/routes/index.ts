import { Hono } from 'hono';
import { TeamsController, MatchesController } from '../controllers/index.js';

const app = new Hono();

app.get('/teams', TeamsController.list);
app.get('/teams/:id', TeamsController.get);

app.get('/matches', MatchesController.list);
app.get('/matches/:id', MatchesController.get);

export default app;