// Renders the hours for the calendar (used in date mode)
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, '0')}:00`,
)


import {
  addDays,
  addMonths,
  format,
  startOfWeek,
} from 'date-fns'
import type { ColumnType } from './DateRangeColumns.types'

type HoursColumnProps = {
  columnType: ColumnType
  start: Date | string
  end: Date | string
  columnSegments: number
  labelHeight: number
}

export const HoursColumn = ({
  columnType,
  start,
  end,
  columnSegments,
  labelHeight,
}: HoursColumnProps) => {
  let labels: string[] = []
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end

  // Always generate exactly columnSegments labels, regardless of type
  if (columnType === 'date') {
    labels = Array.from(
      { length: columnSegments },
      (_, i) => `${i.toString().padStart(2, '0')}:00`,
    )
  } else if (columnType === 'week') {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
    labels = Array.from({ length: columnSegments }, (_, i) =>
      format(addDays(weekStart, i), 'EEE'),
    )
  } else if (columnType === 'month') {
    labels = Array.from({ length: columnSegments }, (_, i) => `Week ${i + 1}`)
  } else if (columnType === 'year') {
    labels = Array.from({ length: columnSegments }, (_, i) =>
      format(addMonths(new Date(startDate.getFullYear(), 0, 1), i), 'MMM'),
    )
  }
  return (
    <div
      className="flex flex-col items-end pr-2 w-14 shrink-0 z-30 h-full"
      style={{ paddingTop: labelHeight }}
    >
      {labels.map((label, idx) => (
        <div
          key={label}
          className={`relative flex items-start justify-end text-xs text-gray-500`}
          style={{
            borderBottom: idx === labels.length - 1 ? 'none' : '1px solid #eee',
            height: `${100 / columnSegments}%`,
          }}
        >
          <span className="absolute -top-2 right-0 text-[10px]">{label}</span>
        </div>
      ))}
    </div>
  )
}
