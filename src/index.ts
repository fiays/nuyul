import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { recordsRoute } from './routes/records';
import { summaryRoute } from './routes/summary';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/', () => 'Nuyul Package Service is running!')
  .use(recordsRoute)
  .use(summaryRoute)
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: '0.0.0.0'
  });

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
