function xmlCell(value: string | number | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  const text = value == null ? '' : String(value);
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<Cell><Data ss:Type="String">${safe}</Data></Cell>`;
}

/** Download a spreadsheet that opens in Excel. */
export function downloadExcel(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Export"><Table>
<Row>${headers.map((header) => xmlCell(header)).join('')}</Row>
${rows.map((row) => `<Row>${row.map((cell) => xmlCell(cell)).join('')}</Row>`).join('')}
</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}
