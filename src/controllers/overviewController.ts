import { OverviewRepository } from '../repositories/overviewRepository.js';
import type { Context } from 'hono';

export const OverviewController = {
    async list(c: Context) {
        const overview = await OverviewRepository.getOverview();
        return c.json(overview);
    }
}