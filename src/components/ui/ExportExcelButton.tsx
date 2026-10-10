import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './Button';
import { downloadExcel } from '../../utils/excel';

export const ExportExcelButton: React.FC<{
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}> = ({ filename, headers, rows }) => (
  <Button
    variant="outline"
    size="sm"
    disabled={rows.length === 0}
    leftIcon={<Download size={14} />}
    onClick={() => downloadExcel(filename, headers, rows)}
  >
    Export Excel
  </Button>
);
