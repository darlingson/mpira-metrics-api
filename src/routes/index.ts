import { Hono } from 'hono';
import { TeamsController, MatchesController } from '../controllers/index.js';
import { CompetitionsController } from '../controllers/competitions.js';

const app = new Hono();

app.get('/teams', TeamsController.list);
app.get('/teams/:id', TeamsController.get);

app.get('/matches', MatchesController.list);
app.get('/matches/:id', MatchesController.get);

app.get('/competitions', CompetitionsController.list);
app.get('/competitions/:id', CompetitionsController.getDetails);

export default app;