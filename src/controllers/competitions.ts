import { CompetitionsRepository } from '../repositories/competitions.js';
import { CompetitionSchema } from '../validators/competitions.js';
import type { Context } from 'hono';

export const CompetitionsController = {
    async list(c: Context) {
        try {
            const data = await CompetitionsRepository.findAll();

            return c.json({
                success: true,
                data
            });
        } catch (error) {
            console.error(error);
            return c.json({ success: false, message: 'Error fetching competitions' }, 500);
        }
    },

    async getDetails(c: Context) {
        const id = c.req.param('id');
        const competition = await CompetitionsRepository.findById(Number(id));

        if (!competition) {
            return c.json({ success: false, message: 'Competition not found' }, 404);
        }

        // Pagination logic for matches only
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        const offset = (page - 1) * limit;

        const { matches, total } = await CompetitionsRepository.getMatches(id, limit, offset);

        return c.json({
            success: true,
            data: {
                competition: CompetitionSchema.parse(competition),
                matches: {
                    data: matches,
                    meta: {
                        total,
                        page,
                        limit,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            }
        });
    }
};