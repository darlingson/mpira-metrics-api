import { MatchesRepository } from '../repositories/index.js';
import { TeamsRepository } from '../repositories/teams.js';
import { TeamSchema, MatchSchema } from '../validators/teams.js';
import type { Context } from 'hono';



export const MatchesController = {
    async list(c: Context) {
        try {
            const data = await MatchesRepository.findAll();
            return c.json({ success: true, data });
        } catch (error) {
            console.error(error);
            return c.json({ success: false, message: 'Error fetching matches' }, 500);
        }
    },

    async get(c: Context) {
        const id = c.req.param('id');
        try {
            const data = await MatchesRepository.findById(Number(id));
            if (!data) {
                return c.json({ success: false, message: 'Match not found' }, 404);
            }
            return c.json({ success: true, data });
        } catch (error) {
            return c.json({ success: false, message: 'Server error' }, 500);
        }
    }
};