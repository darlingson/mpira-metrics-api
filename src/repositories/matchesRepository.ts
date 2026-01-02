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
    },

    async findGroupedBySeasonCompetitionMonth() {
        const query = sql`
      SELECT 
        c.season,
        jsonb_build_object('id', c.id, 'name', c.name, 'type', c.type) as competition,
        to_char(m.date, 'YYYY-MM') as month_key,
        to_char(m.date, 'FMMonth YYYY') as month_name,
        jsonb_build_object(
          'id', m.id,
          'date', m.date,
          'venue', m.venue,
          'score_home', m.score_home,
          'score_away', m.score_away,
          'home_team', to_jsonb(t1),
          'away_team', to_jsonb(t2)
        ) as match
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      JOIN competitions c ON m.competition_id = c.id
      ORDER BY c.season DESC, c.name, m.date DESC
    `;

        const results = await query;
        console.log("Results count:", results.length);
        const grouped: Record<string, any> = {};

        results.forEach(row => {
            const { season, competition, month_key, month_name, match } = row;

            if (!grouped[season]) {
                grouped[season] = {
                    season,
                    competitions: {}
                };
            }

            if (!grouped[season].competitions[competition.id]) {
                grouped[season].competitions[competition.id] = {
                    competition,
                    months: {}
                };
            }

            if (!grouped[season].competitions[competition.id].months[month_key]) {
                grouped[season].competitions[competition.id].months[month_key] = {
                    month_name,
                    matches: []
                };
            }

            grouped[season].competitions[competition.id].months[month_key].matches.push(match);
        });

        return Object.values(grouped).map((seasonData: any) => ({
            season: seasonData.season,
            competitions: Object.values(seasonData.competitions).map((compData: any) => ({
                competition: compData.competition,
                months: Object.values(compData.months).map((monthData: any) => ({
                    month_name: monthData.month_name,
                    matches: monthData.matches
                }))
            }))
        }));
    }
};