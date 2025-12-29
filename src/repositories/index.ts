import { sql } from '../services/db.js';


export const MatchesRepository = {
  async findAll() {
    const query = sql`
      SELECT 
        m.id,
        m.date,
        m.venue,
        m.score_home,
        m.score_away,
        to_jsonb(t1) as home_team,
        to_jsonb(t2) as away_team,
        jsonb_build_object('id', c.id, 'name', c.name, 'type', c.type, 'season', c.season) as competition
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      JOIN competitions c ON m.competition_id = c.id
      ORDER BY m.date DESC
    `;
    return await query;
  },

  async findById(id: number) {
    const query = sql`
      SELECT 
        m.id,
        m.date,
        m.venue,
        m.score_home,
        m.score_away,
        to_jsonb(t1) as home_team,
        to_jsonb(t2) as away_team,
        jsonb_build_object('id', c.id, 'name', c.name, 'type', c.type, 'season', c.season) as competition
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE m.id = ${id}
    `;
    const result = await query;
    return result[0] || null;
  }
};