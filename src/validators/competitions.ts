import { z } from 'zod';

export const CompetitionSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    season: z.string(),
});

export const TopScorerSchema = z.object({
    player_id: z.number(),
    player_name: z.string(),
    goals: z.number(),
    team_name: z.string(),
});

export const CompetitionMatchesSchema = z.object({
    competition_id: z.number(),
    matches: z.array(z.any()),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});