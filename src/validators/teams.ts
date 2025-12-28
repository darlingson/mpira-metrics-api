import { z } from 'zod';

export const TeamSchema = z.object({
    id: z.number(),
    name: z.string(),
    short_name: z.string().nullable(),
    logo_url: z.string().nullable(),
    country: z.string().nullable(),
});

export const MatchSchema = z.object({
    id: z.number(),
    date: z.coerce.date(),
    venue: z.string().nullable(),
    score_home: z.number().nullable(),
    score_away: z.number().nullable(),
    home_team: TeamSchema,
    competition: z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
        season: z.string(),
    }),
});