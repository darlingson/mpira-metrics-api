import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { sql } from './services/db.js';
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/db-test', async (c) => {
  let query = sql`SELECT id, name, type, season FROM competitions`;
  const competitions = await query;
  return c.json({ competitions });
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
