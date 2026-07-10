import { Elysia, t } from 'elysia';
import { db } from '../db';
import { dailyRecords } from '../db/schema';
import { sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface RecordData {
  id: number;
  date: string | Date;
  packageCount: number;
  ratePerPackage: number;
}

export const reportRoute = new Elysia({ prefix: '/report' })
  .get('/pdf', async ({ query, set }) => {
    try {
      const month = query.month ? parseInt(query.month) : null;
      const year = query.year ? parseInt(query.year) : null;

      if (!month || !year) {
        set.status = 400;
        return { error: 'Month and year are required' };
      }

      // Fetch records for the specified month
      const target = `${year}-${String(month).padStart(2, '0')}`;
      const records = await db
        .select()
        .from(dailyRecords)
        .where(sql`DATE_FORMAT(${dailyRecords.date}, '%Y-%m') = ${target}`)
        .orderBy(dailyRecords.date);

      if (records.length === 0) {
        set.status = 400;
        return { error: 'No records found for this month' };
      }

      // Calculate running totals and daily salaries
      let cumulativeTotal = 0;
      const recordsWithCalculations = records.map((record: RecordData) => {
        const dailySalary = record.packageCount * record.ratePerPackage;
        cumulativeTotal += dailySalary;
        return {
          ...record,
          dailySalary,
          cumulativeTotal
        };
      });

      // Generate PDF
      const pdfBuffer = await generatePDF(month, year, recordsWithCalculations);

      set.headers['Content-Type'] = 'application/pdf';
      set.headers['Content-Disposition'] = `attachment; filename="laporan-${year}-${String(month).padStart(2, '0')}.pdf"`;

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      set.status = 500;
      return { error: 'Failed to generate PDF' };
    }
  }, {
    query: t.Object({
      month: t.Optional(t.String()),
      year: t.Optional(t.String())
    })
  });

async function generatePDF(
  month: number,
  year: number,
  records: (RecordData & { dailySalary: number; cumulativeTotal: number })[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const monthName = monthNames[month - 1];

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('LAPORAN GAJIAN', { align: 'center' });
    doc.fontSize(16).font('Helvetica').text(`${monthName} ${year}`, { align: 'center' });
    doc.moveDown();

    // Summary Stats Box
    const summaryStartY = doc.y;
    const totalPackages = records.reduce((sum, r) => sum + r.packageCount, 0);
    const totalSalary = records[records.length - 1]?.cumulativeTotal || 0;

    // Draw summary box border
    doc.rect(50, summaryStartY, 515, 60).stroke();

    // Summary content
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total Paket:', 60, summaryStartY + 10);
    doc.text('Total Gajian:', 250, summaryStartY + 10);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#6366f1');
    doc.text(`${totalPackages} Paket`, 60, summaryStartY + 25);
    doc.text(formatCurrency(totalSalary), 250, summaryStartY + 25);

    doc.fillColor('#000000');
    doc.moveDown(3);

    // Table Header
    const tableTop = doc.y + 10;
    const col1X = 50;
    const col2X = 150;
    const col3X = 250;
    const col4X = 350;
    const col5X = 450;
    const rowHeight = 25;

    // Draw header row background
    doc.rect(col1X - 5, tableTop, 515, rowHeight).fill('#f3f4f6');
    doc.fillColor('#000000');

    // Header text
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Tanggal', col1X, tableTop + 8);
    doc.text('Jumlah Paket', col2X, tableTop + 8);
    doc.text('Tarif/Paket', col3X, tableTop + 8);
    doc.text('Gaji Harian', col4X, tableTop + 8);
    doc.text('Total Kumulatif', col5X, tableTop + 8);

    // Table rows
    let currentY = tableTop + rowHeight;
    doc.fontSize(9).font('Helvetica');

    records.forEach((record, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;

        // Redraw header on new page
        doc.rect(col1X - 5, currentY, 515, rowHeight).fill('#f3f4f6');
        doc.fillColor('#000000');
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Tanggal', col1X, currentY + 8);
        doc.text('Jumlah Paket', col2X, currentY + 8);
        doc.text('Tarif/Paket', col3X, currentY + 8);
        doc.text('Gaji Harian', col4X, currentY + 8);
        doc.text('Total Kumulatif', col5X, currentY + 8);
        currentY += rowHeight;
        doc.fontSize(9).font('Helvetica');
      }

      // Draw row background (alternating)
      if (index % 2 === 0) {
        doc.rect(col1X - 5, currentY, 515, rowHeight).fill('#fafafa');
      }
      doc.fillColor('#000000');

      const dateStr = new Date(record.date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      doc.text(dateStr, col1X, currentY + 8);
      doc.text(String(record.packageCount), col2X, currentY + 8);
      doc.text(`Rp ${record.ratePerPackage.toLocaleString('id-ID')}`, col3X, currentY + 8);
      doc.text(formatCurrency(record.dailySalary), col4X, currentY + 8);
      doc.text(formatCurrency(record.cumulativeTotal), col5X, currentY + 8);

      currentY += rowHeight;
    });

    // Draw table border
    doc.rect(col1X - 5, tableTop, 515, (records.length) * rowHeight + rowHeight).stroke();

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    const footerText = `Laporan dibuat pada: ${new Date().toLocaleDateString('id-ID')} pukul ${new Date().toLocaleTimeString('id-ID')}`;
    doc.text(footerText, { align: 'center' });

    doc.end();
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
