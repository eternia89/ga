import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

/**
 * Apply standard styling to an Excel worksheet:
 * - Header row (row 1): bold, white text, blue background, centered alignment, height 24
 * - All cells: thin borders
 * - Auto-fit columns based on header text length
 */
export function applyStandardStyles(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);

  headerRow.height = 24;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Apply borders to all rows that have data
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Auto-fit columns based on header text length + padding (min 10)
  sheet.columns.forEach((column) => {
    const headerText = String(column.header ?? '');
    column.width = Math.max(headerText.length + 4, 10);
  });
}

/**
 * Create a styled workbook with frozen header row.
 * Returns references to the workbook and sheet for adding rows.
 */
export function createStyledWorkbook(
  sheetName: string,
  columns: { header: string; key: string; width: number }[]
): { workbook: ExcelJS.Workbook; sheet: ExcelJS.Worksheet } {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns;

  return { workbook, sheet };
}

/**
 * Write the workbook to a buffer and return a NextResponse for file download.
 */
export async function generateExcelResponse(
  workbook: ExcelJS.Workbook,
  filename: string
): Promise<NextResponse> {
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
