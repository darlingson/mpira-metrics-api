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

    async findGroupedBySeasonCompetitionMonth(season?: string, page: number = 1, limit: number = 50) {
        const offset = (page - 1) * limit;

        // If no season specified, get the latest season
        let targetSeason = season;
        if (!targetSeason) {
            const latestSeasonQuery = sql`
            SELECT DISTINCT season 
            FROM competitions c
            JOIN matches m ON m.competition_id = c.id
            ORDER BY season DESC 
            LIMIT 1
        `;
            const latestSeasonResult = await latestSeasonQuery;
            targetSeason = latestSeasonResult[0]?.season;
        }

        // Get total count for pagination metadata
        const countQuery = sql`
        SELECT COUNT(*) as total
        FROM matches m
        JOIN competitions c ON m.competition_id = c.id
        WHERE c.season = ${targetSeason as string}
    `;
        const countResult = await countQuery;
        const total = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(total / limit);

        // Get paginated matches with all necessary data
        const matchesQuery = sql`
        SELECT 
            m.id,
            m.date,
            m.venue,
            m.score_home,
            m.score_away,
            c.season,
            jsonb_build_object('id', c.id, 'name', c.name, 'type', c.type) as competition,
            to_char(m.date, 'YYYY-MM') as month_key,
            to_char(m.date, 'FMMonth YYYY') as month_name,
            jsonb_build_object('id', t1.id, 'name', t1.name, 'short_name', t1.short_name, 'logo_url', t1.logo_url) as home_team,
            jsonb_build_object('id', t2.id, 'name', t2.name, 'short_name', t2.short_name, 'logo_url', t2.logo_url) as away_team
        FROM matches m
        JOIN teams t1 ON m.home_team_id = t1.id
        JOIN teams t2 ON m.away_team_id = t2.id
        JOIN competitions c ON m.competition_id = c.id
        WHERE c.season = ${targetSeason as string}
        ORDER BY m.date DESC
        LIMIT ${limit} OFFSET ${offset}
    `;

        const matches = await matchesQuery;

        return {
            season: targetSeason,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            matches: matches.map(match => ({
                id: match.id,
                date: match.date,
                venue: match.venue,
                score_home: match.score_home,
                score_away: match.score_away,
                competition: match.competition,
                month_key: match.month_key,
                month_name: match.month_name,
                home_team: match.home_team,
                away_team: match.away_team
            }))
        };
    }
};