import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { recordsRoute } from './routes/records';
import { summaryRoute } from './routes/summary';
import { reportRoute } from './routes/report';

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
  }))
  .use(swagger())
  .use(staticPlugin({
    assets: 'client/dist',
    prefix: '/'
  }))
  .use(recordsRoute)
  .use(summaryRoute)
  .use(reportRoute)
  .get('/', () => Bun.file('client/dist/index.html'))
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: '0.0.0.0'
  });

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
