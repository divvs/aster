import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns'
import type React from 'react'

import type { DayFilter } from './DateRangeColumns.types'

import type { ColumnType } from './DateRangeColumns.types'

import type { WeekNumberType } from './DateRangeColumns.types'

interface DateRangeColumnsProps {
  start: Date | string
  end: Date | string
  dayFilter?: DayFilter
  columnType: ColumnType
  weekNumberType: WeekNumberType
}

export const DateRangeColumns: React.FC<DateRangeColumnsProps> = ({
  start,
  end,
  dayFilter = 'all',
  columnType,
  weekNumberType,
}) => {
  // Ensure dates are Date objects
  const startDate = typeof start === 'string' ? parseISO(start) : start
  const endDate = typeof end === 'string' ? parseISO(end) : end

  if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
    return <div>Invalid date range</div>
  }

  let columns: { label: string; sublabel?: string; key: string }[] = []

  if (columnType === 'date') {
    let dates = eachDayOfInterval({ start: startDate, end: endDate })
    if (dayFilter === 'business') {
      dates = dates.filter((d) => {
        const day = d.getDay()
        return day >= 1 && day <= 5 // Mon-Fri
      })
    } else if (dayFilter === 'weekend') {
      dates = dates.filter((d) => {
        const day = d.getDay()
        return day === 0 || day === 6 // Sun or Sat
      })
    }
    columns = dates.map((date) => ({
      label: format(date, 'MMMM dd'),
      sublabel: format(date, 'EEEE'),
      key: format(date, 'yyyy-MM-dd'),
    }))
  } else if (columnType === 'week') {
    // Generate week start dates
    const weeks = []
    // Determine weekStartsOn based on weekNumberType
    const weekStartsOn = weekNumberType === 'us' ? 0 : 1
    let current = startOfWeek(startDate, { weekStartsOn })
    while (current <= endDate) {
      const weekEnd = endOfWeek(current, { weekStartsOn })
      weeks.push({
        start: new Date(current),
        end: new Date(Math.min(weekEnd.getTime(), endDate.getTime())),
      })
      current = new Date(current)
      current.setDate(current.getDate() + 7)
    }
    columns = weeks.map(({ start, end }) => {
      let weekNumber
      if (weekNumberType === 'iso') {
        // ISO week number
        // Thursday in current week decides the year.
        const thursday = new Date(start)
        thursday.setDate(thursday.getDate() + 3)
        const firstThursday = new Date(thursday.getFullYear(), 0, 4)
        const weekStart = startOfWeek(firstThursday, { weekStartsOn: 1 })
        weekNumber =
          Math.floor(
            (thursday.getTime() - weekStart.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          ) + 1
      } else {
        // US week number: week 1 contains Jan 1, weeks start on Sunday
        const yearStart = new Date(start.getFullYear(), 0, 1)
        weekNumber =
          Math.floor(
            (start.getTime() -
              startOfWeek(yearStart, { weekStartsOn: 0 }).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          ) + 1
      }
      // For week columns, show week number as the column header and show each day as a segment
      return {
        label: `Week ${weekNumber}`,
        sublabel: '',
        key: `${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`,
        days: Array.from({ length: 7 }, (_, i) =>
          format(
            new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate() + i,
            ),
            'EEE dd',
          ),
        ),
        start,
        end,
      }
    })
  } else if (columnType === 'month') {
    // Generate months
    const months = []
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    while (current <= endDate) {
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      )
      months.push({
        start: new Date(current),
        end: new Date(Math.min(monthEnd.getTime(), endDate.getTime())),
      })
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    }
    columns = months.map(({ start, end }) => ({
      label: `${format(start, 'MMMM')}`,
      sublabel:
        start.getFullYear() !== end.getFullYear()
          ? `${format(end, 'yyyy')}`
          : format(start, 'yyyy'),
      key: `${format(start, 'yyyy-MM')}`,
    }))
  } else if (columnType === 'year') {
    // Generate years
    const years = []
    let current = new Date(startDate.getFullYear(), 0, 1)
    while (current <= endDate) {
      const yearEnd = new Date(current.getFullYear(), 11, 31)
      years.push({
        start: new Date(current),
        end: new Date(Math.min(yearEnd.getTime(), endDate.getTime())),
      })
      current = new Date(current.getFullYear() + 1, 0, 1)
    }
    columns = years.map(({ start }) => ({
      label: `${format(start, 'yyyy')}`,
      key: `${format(start, 'yyyy')}`,
    }))
  }

  if (
    columnType === 'week' ||
    columnType === 'month' ||
    columnType === 'year'
  ) {
    // Render columns, each with a list of events (no grid, no date/row/segment cells, no week numbers)
    return (
      <div className="h-full flex gap-2 bg-white rounded-xl overflow-hidden">
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-1 flex flex-col p-4 border-r last:border-r-0 border-gray-100"
          >
            <div className="font-medium text-center mb-2">{col.label}</div>
            {/* Replace this with your event list rendering logic for this column */}
            <ul className="list-disc pl-4 space-y-2">
              <li>Event 1 (example for {col.label})</li>
              <li>Event 2</li>
            </ul>
          </div>
        ))}
      </div>
    )
  }
  // Default (date):
  return (
    <div className="h-full w-full flex gap-2 bg-white rounded-xl overflow-hidden">
      {columns.map((col) => (
        <div
          className="flex-1 flex flex-col justify-between text-sm py-2 px-4"
          key={col.key}
        >
          <div className="font-medium">{col.label}</div>
          {col.sublabel && (
            <div className="text-xs text-gray-500">{col.sublabel}</div>
          )}
        </div>
      ))}
    </div>
  )
}
