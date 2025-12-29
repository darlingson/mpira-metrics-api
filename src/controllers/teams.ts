import type { Context } from 'hono';
import { TeamsRepository } from '../repositories/teams.js';
import { TeamSchema, MatchSchema } from '../validators/teams.js';

export const TeamsController = {
    async list(c: Context) {
        try {
            const data = await TeamsRepository.findAll();
            const teams = TeamSchema.array().safeParse(data);

            return c.json({ success: true, data: teams.success ? teams.data : data });
        } catch (error) {
            console.error(error);
            return c.json({ success: false, message: 'Error fetching teams' }, 500);
        }
    },

    async get(c: Context) {
        const id = c.req.param('id');
        try {
            const data = await TeamsRepository.findById(Number(id));
            if (!data) {
                return c.json({ success: false, message: 'Team not found' }, 404);
            }
            const team = TeamSchema.parse(data);
            return c.json({ success: true, data: team });
        } catch (error) {
            return c.json({ success: false, message: 'Server error' }, 500);
        }
    }
};