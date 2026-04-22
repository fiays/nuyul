import { mysqlTable, serial, int, date, timestamp } from 'drizzle-orm/mysql-core';

export const dailyRecords = mysqlTable('daily_records', {
  id: int('id').primaryKey().autoincrement(),
  date: date('date').notNull(),
  packageCount: int('package_count').notNull(),
  ratePerPackage: int('rate_per_package').notNull().default(1100),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type DailyRecord = typeof dailyRecords.$inferSelect;
export type NewDailyRecord = typeof dailyRecords.$inferInsert;
