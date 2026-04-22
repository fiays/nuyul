import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { recordsRoute } from './routes/records';
import { summaryRoute } from './routes/summary';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(staticPlugin({
    assets: 'client/dist',
    prefix: '/'
  }))
  .use(recordsRoute)
  .use(summaryRoute)
  .get('/', () => Bun.file('client/dist/index.html'))
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: '0.0.0.0'
  });

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
