import { Elysia, t } from 'elysia';
import { db } from '../db';
import { dailyRecords } from '../db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export const summaryRoute = new Elysia({ prefix: '/summary' })
  .get('/', async ({ query }) => {
    const month = query.month ? parseInt(query.month) : null;
    const year = query.year ? parseInt(query.year) : null;

    let baseQuery = db.select({
      totalPackages: sql<string | number>`sum(${dailyRecords.packageCount})`,
      totalSalary: sql<string | number>`sum(${dailyRecords.packageCount} * ${dailyRecords.ratePerPackage})`,
      count: sql<string | number>`count(*)`
    }).from(dailyRecords).$dynamic();

    if (month && year) {
      const target = `${year}-${String(month).padStart(2, '0')}`;
      baseQuery = baseQuery.where(
        sql`DATE_FORMAT(${dailyRecords.date}, '%Y-%m') = ${target}`
      );
    }

    const result = await baseQuery;
    const summary = result[0] || { totalPackages: 0, totalSalary: 0, count: 0 };

    return {
      totalPackages: Number(summary.totalPackages) || 0,
      totalSalary: Number(summary.totalSalary) || 0,
      recordCount: Number(summary.count) || 0,
      period: month && year ? `${month}/${year}` : "All Time"
    };
  }, {
    query: t.Object({
      month: t.Optional(t.String()),
      year: t.Optional(t.String())
    })
  });
