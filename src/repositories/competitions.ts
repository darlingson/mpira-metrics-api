import { sql } from '../services/db.js';

export const CompetitionsRepository = {
  async list() {
    const query = sql`SELECT * FROM competitions`;
    return await query;
  },
  async findAll() {
    // The LATERAL JOIN allows us to fetch top 10 scorers specifically for each competition row
    const query = sql`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.season,
        -- This subquery runs once for every competition found
        (
          SELECT COALESCE(jsonb_agg(scorer), '[]')
          FROM (
            SELECT 
              p.id as player_id,
              p.name as player_name,
              t.name as team_name,
              COUNT(e.id) as goals
            FROM match_events e
            JOIN matches m ON e.match_id = m.id
            JOIN players p ON e.player_id = p.id
            LEFT JOIN player_team_history pth ON pth.player_id = p.id 
              AND m.date >= pth.start_date 
              AND (pth.end_date IS NULL OR m.date <= pth.end_date)
            LEFT JOIN teams t ON pth.team_id = t.id
            WHERE e.event_type = 'goal'
              AND m.competition_id = c.id
            GROUP BY p.id, p.name, t.name
            ORDER BY goals DESC
            LIMIT 10
          ) scorer
        ) as top_scorers
      FROM competitions c
      ORDER BY c.season DESC, c.name ASC
    `;
    return await query;
  },
  async findById(id: number) {
    const query = sql`SELECT * FROM competitions WHERE id = ${id}`;
    const result = await query;
    return result[0] || null;
  },

  /**
   * Gets top scorers.
   * @param {number|null} competitionId - If provided, filters by specific competition. Else filters by year.
   * @param {string|null} year - The year to filter by (e.g., '2025'). Only used if competitionId is null.
   */
  async getTopScorers(competitionId = null, year = null) {
    // We join match_events -> matches -> competitions -> players -> teams
    // We filter WHERE event_type = 'goal'

    let query = sql`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        t.name as team_name,
        COUNT(e.id) as goals
      FROM match_events e
      JOIN matches m ON e.match_id = m.id
      JOIN players p ON e.player_id = p.id
      LEFT JOIN player_team_history pth ON pth.player_id = p.id 
        AND m.date >= pth.start_date 
        AND (pth.end_date IS NULL OR m.date <= pth.end_date)
      LEFT JOIN teams t ON pth.team_id = t.id
      WHERE e.event_type = 'goal'
    `;

    if (competitionId) {
      query = sql`${query} AND m.competition_id = ${competitionId}`;
    } else if (year) {
      // Assuming season is stored as "2025" or "2025/26". 
      // We check if the season string starts with the year.
      query = sql`${query} AND c.season LIKE ${year + '%'}`;
    }

    query = sql`
      ${query}
      GROUP BY p.id, p.name, t.name
      ORDER BY goals DESC
      LIMIT 10
    `;

    return await query;
  },

  /**
   * Gets matches for a competition with pagination
   */
  async getMatches(id: string, limit = 10, offset = 0) {
    // We need to fetch the data AND the total count for pagination metadata

    const query = sql`
      SELECT 
        m.id,
        m.date,
        m.venue,
        m.score_home,
        m.score_away,
        to_jsonb(t1) as home_team,
        to_jsonb(t2) as away_team
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.competition_id = ${id}
      ORDER BY m.date DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countQuery = sql`
      SELECT COUNT(*) as total
      FROM matches
      WHERE competition_id = ${id}
    `;

    const [matches, countResult] = await Promise.all([query, countQuery]);

    const total = parseInt(countResult[0].total);

    return { matches, total };
  }
};