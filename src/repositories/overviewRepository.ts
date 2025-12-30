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
        const [collapses, comebacks, patterns, clutch] = await Promise.all([
            this.getLateCollapses(currentComp.id),
            this.getComebackKings(currentComp.id),
            this.getAttackPatterns(currentComp.id),
            this.getClutchPlayers(currentComp.id)
        ]);

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
            },
            late_collapses: collapses,
            comeback_kings: comebacks,
            attack_patterns: patterns,
            clutch_players: clutch
        };
    },

    _calculateChange(current: number, last: number): string {
        if (!last || last === 0) return "0%";
        const diff = ((current - last) / last) * 100;
        return (diff > 0 ? "+" : "") + diff.toFixed(1) + "%";
    },
    async getLateCollapses(competitionId: number) {
        const query = sql`
        WITH match_scores_at_75 AS (
            SELECT 
                m.id as match_id,
                m.home_team_id,
                m.away_team_id,
                m.score_home as final_home,
                m.score_away as final_away,
                -- Count home goals before 75'
                (SELECT COUNT(*) FROM match_events e 
                 WHERE e.match_id = m.id AND e.event_type = 'goal' 
                 AND e.minute <= 75 AND e.player_id IN (
                    SELECT player_id FROM player_team_history pth 
                    WHERE pth.team_id = m.home_team_id
                 )
                ) as home_75,
                -- Count away goals before 75'
                (SELECT COUNT(*) FROM match_events e 
                 WHERE e.match_id = m.id AND e.event_type = 'goal' 
                 AND e.minute <= 75 AND e.player_id IN (
                    SELECT player_id FROM player_team_history pth 
                    WHERE pth.team_id = m.away_team_id
                 )
                ) as away_75
            FROM matches m
            WHERE m.competition_id = ${competitionId}
        )
        SELECT 
            t.name as team_name,
            COUNT(*) as collapse_count
        FROM (
            -- Home team collapsed
            SELECT home_team_id as team_id FROM match_scores_at_75
            WHERE home_75 >= away_75 AND final_home < final_away
            UNION ALL
            -- Away team collapsed
            SELECT away_team_id as team_id FROM match_scores_at_75
            WHERE away_75 >= home_75 AND final_away < final_home
        ) collapses
        JOIN teams t ON t.id = collapses.team_id
        GROUP BY t.name
        ORDER BY collapse_count DESC
    `;
        return await query;
    },
    async getComebackKings(competitionId: number) {
        const query = sql`
        WITH match_timeline AS (
            SELECT 
                m.id as match_id,
                m.home_team_id,
                m.away_team_id,
                m.score_home,
                m.score_away,
                e.minute,
                CASE WHEN pth.team_id = m.home_team_id THEN 'home' ELSE 'away' END as scorer_side
            FROM matches m
            JOIN match_events e ON e.match_id = m.id
            JOIN player_team_history pth ON pth.player_id = e.player_id 
                AND pth.team_id IN (m.home_team_id, m.away_team_id)
            WHERE m.competition_id = ${competitionId} AND e.event_type = 'goal'
            ORDER BY m.id, e.minute
        ),
        trailing_moments AS (
            SELECT DISTINCT match_id, 
                CASE WHEN scorer_side = 'home' THEN away_team_id ELSE home_team_id END as trailing_team_id
            FROM match_timeline mt1
            -- A team is trailing if at any minute the opponent has more goals
            WHERE (
                SELECT COUNT(*) FROM match_timeline mt2 
                WHERE mt2.match_id = mt1.match_id AND mt2.minute <= mt1.minute AND mt2.scorer_side = 'home'
            ) != (
                SELECT COUNT(*) FROM match_timeline mt2 
                WHERE mt2.match_id = mt1.match_id AND mt2.minute <= mt1.minute AND mt2.scorer_side = 'away'
            )
        )
        SELECT 
            t.name as team_name,
            COUNT(tm.match_id) as comeback_wins
        FROM trailing_moments tm
        JOIN matches m ON m.id = tm.match_id
        JOIN teams t ON t.id = tm.trailing_team_id
        WHERE 
            (tm.trailing_team_id = m.home_team_id AND m.score_home > m.score_away) OR
            (tm.trailing_team_id = m.away_team_id AND m.score_away > m.score_home)
        GROUP BY t.name
        ORDER BY comeback_wins DESC
    `;
        return await query;
    },
    async getAttackPatterns(competitionId: number) {
        const query = sql`
        WITH team_goal_counts AS (
            SELECT 
                t.id as team_id,
                t.name as team_name,
                COUNT(e.id) as total_team_goals,
                COUNT(DISTINCT e.player_id) as unique_scorers
            FROM teams t
            JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
            JOIN match_events e ON e.match_id = m.id
            JOIN player_team_history pth ON pth.player_id = e.player_id AND pth.team_id = t.id
            WHERE m.competition_id = ${competitionId} AND e.event_type = 'goal'
            GROUP BY t.id, t.name
        ),
        top_individual_scorers AS (
            SELECT 
                pth.team_id,
                e.player_id,
                COUNT(e.id) as player_goals
            FROM match_events e
            JOIN player_team_history pth ON e.player_id = pth.player_id
            JOIN matches m ON e.match_id = m.id
            WHERE m.competition_id = ${competitionId} AND e.event_type = 'goal'
            GROUP BY pth.team_id, e.player_id
        ),
        max_player_contribution AS (
            SELECT 
                team_id, 
                MAX(player_goals) as top_scorer_goals
            FROM top_individual_scorers
            GROUP BY team_id
        )
        SELECT 
            tgc.team_name,
            tgc.total_team_goals,
            tgc.unique_scorers,
            CASE 
                WHEN (mpc.top_scorer_goals::numeric / NULLIF(tgc.total_team_goals, 0)) > 0.5 
                THEN 'Single Point of Failure'
                WHEN tgc.unique_scorers >= 4 
                THEN 'Distributed Attack'
                ELSE 'Balanced'
            END as pattern_type
        FROM team_goal_counts tgc
        LEFT JOIN max_player_contribution mpc ON tgc.team_id = mpc.team_id
    `;
        return await query;
    },
    async getClutchPlayers(competitionId: number) {
        const query = sql`
        SELECT 
            p.name as player_name,
            t.name as team_name,
            COUNT(e.id) as clutch_goals
        FROM match_events e
        JOIN players p ON e.player_id = p.id
        JOIN matches m ON e.match_id = m.id
        JOIN player_team_history pth ON pth.player_id = p.id 
            AND (pth.team_id = m.home_team_id OR pth.team_id = m.away_team_id)
        JOIN teams t ON t.id = pth.team_id
        WHERE m.competition_id = ${competitionId}
          AND e.event_type = 'goal'
          AND e.minute >= 75
        GROUP BY p.name, t.name
        HAVING COUNT(e.id) > 0
        ORDER BY clutch_goals DESC, p.name ASC
    `;
        return await query;
    }
};