import { MatchesRepository } from '../repositories/matchesRepository.js';
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
    },
    async getMatches(c: Context) {
        console.log("getMatches called")
        try {
            const data = await MatchesRepository.findGroupedBySeasonCompetitionMonth();
            console.log("Data retrieved successfully, matches count:", data.length);
            return c.json({ success: true, data });
        } catch (error) {
            console.error("Error in getMatches:", error);
            return c.json({ success: false, message: 'Error fetching matches' }, 500);
        }
    }
};