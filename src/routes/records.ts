import { Elysia, t } from 'elysia';
import { db } from '../db';
import { dailyRecords } from '../db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

export const recordsRoute = new Elysia({ prefix: '/records' })
  .get('/', async ({ query }) => {
    const month = query.month ? parseInt(query.month) : null;
    const year = query.year ? parseInt(query.year) : null;

    let baseQuery = db.select().from(dailyRecords).$dynamic();
    
    if (month && year) {
      const target = `${year}-${String(month).padStart(2, '0')}`;
      baseQuery = baseQuery.where(
        sql`DATE_FORMAT(${dailyRecords.date}, '%Y-%m') = ${target}`
      );
    }
    
    return await baseQuery.orderBy(dailyRecords.date);
  }, {
    query: t.Object({
      month: t.Optional(t.String()),
      year: t.Optional(t.String())
    })
  })
  .post('/', async ({ body }) => {
    await db.insert(dailyRecords).values({
      date: new Date(body.date),
      packageCount: body.packageCount,
      ratePerPackage: body.ratePerPackage ?? 1100,
    });
    return { success: true, message: 'Record created successfully' };
  }, {
    body: t.Object({
      date: t.String(),
      packageCount: t.Number(),
      ratePerPackage: t.Optional(t.Number()),
    })
  })
  .put('/:id', async ({ params, body }) => {
    const updateData: any = {
      packageCount: body.packageCount,
      ratePerPackage: body.ratePerPackage,
    };
    
    if (body.date) {
      updateData.date = new Date(body.date);
    }

    await db.update(dailyRecords)
      .set(updateData)
      .where(eq(dailyRecords.id, parseInt(params.id)));
      
    return { success: true, message: 'Record updated successfully' };
  }, {
    body: t.Object({
      date: t.Optional(t.String()),
      packageCount: t.Optional(t.Number()),
      ratePerPackage: t.Optional(t.Number()),
    })
  })
  .delete('/:id', async ({ params }) => {
    await db.delete(dailyRecords).where(eq(dailyRecords.id, parseInt(params.id)));
    return { success: true, message: 'Record deleted successfully' };
  });
