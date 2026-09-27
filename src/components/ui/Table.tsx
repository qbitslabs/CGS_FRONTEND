/* Clinic data table primitives plus pagination footer.
 * Shared by leads, patients, appointments, and invoices. */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const TableContainer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      width: '100%',
      overflowX: 'auto',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-xs)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <table
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '13px',
      ...style,
    }}
    className={`custom-table ${className}`}
    {...props}
  >
    {children}
  </table>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  style,
  ...props
}) => (
  <thead
    style={{
      backgroundColor: 'var(--c-slate-50)',
      borderBottom: '1px solid var(--border-light)',
      ...style,
    }}
    {...props}
  >
    {children}
  </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  style,
  ...props
}) => (
  <tbody style={{ ...style }} {...props}>
    {children}
  </tbody>
);

export const Tr: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { isHoverable?: boolean; isClickable?: boolean }
> = ({ children, isHoverable = true, isClickable = false, style, ...props }) => (
  <tr
    style={{
      borderBottom: '1px solid var(--border-subtle)',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'background-color 0.12s ease',
      ...style,
    }}
    onMouseEnter={(e) => {
      if (isHoverable || isClickable) {
        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
      }
    }}
    onMouseLeave={(e) => {
      if (isHoverable || isClickable) {
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    }}
    {...props}
  >
    {children}
  </tr>
);

export const Th: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean; isSorted?: boolean; sortOrder?: 'asc' | 'desc' }
> = ({ children, sortable = false, isSorted = false, sortOrder, style, ...props }) => (
  <th
    style={{
      padding: '12px 16px',
      fontWeight: 600,
      fontSize: '12px',
      color: 'var(--c-slate-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      cursor: sortable ? 'pointer' : 'default',
      userSelect: sortable ? 'none' : 'auto',
      ...style,
    }}
    {...props}
  >
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {children}
      {sortable && isSorted && (
        <span style={{ color: 'var(--c-primary-700)', fontSize: '10px' }}>
          {sortOrder === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </div>
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  style,
  ...props
}) => (
  <td
    style={{
      padding: '12px 16px',
      color: 'var(--text-primary)',
      verticalAlign: 'middle',
      ...style,
    }}
    {...props}
  >
    {children}
  </td>
);

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const effectiveTotalPages = Math.max(1, totalPages);

  // Generate page numbers array (up to 5 page pills)
  const pageNumbers: number[] = [];
  for (let i = 1; i <= effectiveTotalPages; i++) {
    if (
      i === 1 ||
      i === effectiveTotalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pageNumbers.push(i);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startItem}</span> to{' '}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endItem}</span> of{' '}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalItems}</span> records
        </div>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft size={14} />}
          style={{ height: '30px', padding: '0 10px' }}
        >
          Previous
        </Button>

        {pageNumbers.map((p, idx) => {
          const prev = pageNumbers[idx - 1];
          const hasGap = prev && p - prev > 1;

          return (
            <React.Fragment key={p}>
              {hasGap && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-md)',
                  border: p === page ? '1px solid var(--c-primary-700)' : '1px solid var(--border-light)',
                  backgroundColor: p === page ? 'var(--c-primary-700)' : '#ffffff',
                  color: p === page ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: p === page ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: '0 6px',
                }}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= effectiveTotalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight size={14} />}
          style={{ height: '30px', padding: '0 10px' }}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
