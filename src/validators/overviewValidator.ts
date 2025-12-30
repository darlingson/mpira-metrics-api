import { z } from 'zod';

export const OverviewSchema = z.object({
    goals: z.object({
        current_season_total: z.number(),
        last_season_total: z.number(),
        percentage_change: z.string(),
    }),
    league_pulse: z.object({
        avg_cards_per_match: z.number(),
        home_win_percentage: z.number(),
        avg_goals_per_match: z.number(),
        total_draws: z.number()
    })
    // We will add collapse_risks, comeback_kings, etc., as we build them
});