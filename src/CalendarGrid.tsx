import type React from 'react'

import type { PropsWithChildren } from 'react'

// Helper to generate hour labels
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, '0')}:00`,
)

export type CalendarGridProps = {
  numColumns: number
  numRows: number
  rowLabels?: string[]
  children?: React.ReactNode
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  numColumns,
  numRows,
  rowLabels,
  children,
}) => {
  return (
    <div className="relative flex w-full h-full z-30">
      {/* Main grid area */}
      <div className="flex-1 relative  h-full">
        {/* Vertical columns */}
        <div className="absolute inset-0 flex">
          {[...Array(numColumns)].map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-full border-l first:border-none border-gray-200"
            />
          ))}
        </div>
        {/* Horizontal rows */}
        <div className="absolute inset-0 ">
          {[...Array(numRows)].map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="absolute left-0 right-0 border-b border-dashed border-gray-200"
              style={{
                top: `${(100 / numRows) * rowIdx}%`,
              }}
            />
          ))}
        </div>
        {/* Render children (columns) over the grid */}
        {children && (
          <div className="absolute inset-0 pointer-events-none -z-50">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
