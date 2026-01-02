import { Hono } from 'hono';
import { MatchesController } from '../controllers/matchesController.js';
import { CompetitionsController } from '../controllers/competitions.js';
import { TeamsController } from '../controllers/teams.js';
import { OverviewController } from '../controllers/overviewController.js';

const app = new Hono();


app.get('/teams', TeamsController.list);
app.get('/teams/:id', TeamsController.get);

app.get('/matches', MatchesController.list);
app.get('/matches/grouped', MatchesController.getMatches);
app.get('/matches/:id', MatchesController.get);

app.get('/competitions', CompetitionsController.list);
app.get('/competitions/:id', CompetitionsController.getDetails);

app.get('/overview', OverviewController.list);

export default app;