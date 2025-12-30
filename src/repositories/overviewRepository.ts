import { sql } from '../services/db.js';

export const OverviewRepository = {
    async getOverview() {
        const [currentComp] = await sql`
            SELECT id, season FROM competitions 
            WHERE type = 'league' 
            ORDER BY season DESC LIMIT 1
        `;

        if (!currentComp) return null;

        const currentYear = currentComp.season;
        const lastYear = (parseInt(currentYear) - 1).toString();

        const [currentGoals] = await sql`
            SELECT SUM(score_home + score_away) as total, COUNT(*) as matches 
            FROM matches 
            WHERE competition_id = ${currentComp.id}
        `;

        const [lastGoals] = await sql`
            SELECT SUM(score_home + score_away) as total 
            FROM matches m
            JOIN competitions c ON m.competition_id = c.id
            WHERE c.season = ${lastYear} AND c.type = 'league'
        `;

        const pulse = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE score_home > score_away) as home_wins,
                COUNT(*) FILTER (WHERE score_home = score_away) as draws,
                (SELECT COUNT(*) FROM match_events e 
                 JOIN matches m2 ON e.match_id = m2.id 
                 WHERE m2.competition_id = ${currentComp.id} 
                 AND e.event_type IN ('yellow_card', 'red_card')) as total_cards
            FROM matches 
            WHERE competition_id = ${currentComp.id}
        `;

        const pulseData = pulse[0];
        const matchesCount = Number(currentGoals.matches || 0);

        return {
            goals: {
                current_season_total: Number(currentGoals.total || 0),
                last_season_total: Number(lastGoals.total || 0),
                percentage_change: this._calculateChange(currentGoals.total, lastGoals.total),
            },
            league_pulse: {
                avg_cards_per_match: matchesCount > 0 ? Number((pulseData.total_cards / matchesCount).toFixed(2)) : 0,
                home_win_percentage: matchesCount > 0 ? Number(((pulseData.home_wins / matchesCount) * 100).toFixed(1)) : 0,
                avg_goals_per_match: matchesCount > 0 ? Number((currentGoals.total / matchesCount).toFixed(2)) : 0,
                total_draws: Number(pulseData.draws || 0)
            }
        };
    },

    _calculateChange(current: number, last: number): string {
        if (!last || last === 0) return "0%";
        const diff = ((current - last) / last) * 100;
        return (diff > 0 ? "+" : "") + diff.toFixed(1) + "%";
    }
};