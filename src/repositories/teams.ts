import { sql } from '../services/db.js';

export const TeamsRepository = {
    async findAll() {
        const query = sql`SELECT * FROM teams ORDER BY name`;
        return await query;
    },

    async findById(id: number) {
        const query = sql`SELECT * FROM teams WHERE id = ${id}`;
        const result = await query;
        return result[0] || null;
    },
    async searchByName(name: string) {
        const query = sql`SELECT * FROM teams WHERE name ILIKE ${name}`;
        const result = await query;
        return result;
    },
    async teamPerformance(id: number) {

    }
};