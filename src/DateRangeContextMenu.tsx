import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, getISOWeek } from 'date-fns'

import type { DayFilter, RangeType } from './DateRangeColumns.types'

import type { ColumnType } from './DateRangeColumns.types'

import type { WeekNumberType } from './DateRangeColumns.types'

interface Props {
  open: boolean
  x: number
  y: number
  start: string
  end: string

  rangeType: RangeType
  dayFilter: DayFilter
  columnType: ColumnType
  weekNumberType: WeekNumberType
  onClose: () => void
  onChange: (values: {
    start?: string
    end?: string

    rangeType?: RangeType
    dayFilter?: DayFilter
    columnType?: ColumnType
    weekNumberType?: WeekNumberType

  }) => void
}
const Chip = ({
  text,
  active,
  onClick,
}: { text: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    className={`pt-1 pb-1.5 px-4 transition-all duration-100 ease-in-out focus:outline-none select-none cursor-pointer text-sm font-medium ${
      active ? 'bg-white text-black ' : 'bg-gray-300 text-white'
    }`}
    style={{ minWidth: 90 }}
    onClick={onClick}
    aria-pressed={active}
  >
    {text}
  </button>
)
// Helper: get week info for a given date
function getWeekInfo(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  const weekNumber = getISOWeek(date)
  return { start, end, weekNumber }
}

// WeekSelector component for week selection UI
const WeekSelector: React.FC<{
  start: string,
  onChange: (vals: { start: string; end: string }) => void
}> = ({ start, onChange }) => {
  // Center week is the week containing the current start date
  const [centerDate, setCenterDate] = useState(() => new Date(start))
  // Show 3 weeks: previous, current, next
  const weeks = [-1, 0, 1].map((offset) => {
    const weekDate = addWeeks(centerDate, offset)
    return getWeekInfo(weekDate)
  })
  // Handler for prev/next
  const handlePrev = () => setCenterDate((d) => subWeeks(d, 1))
  const handleNext = () => setCenterDate((d) => addWeeks(d, 1))
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 border"
        onClick={handlePrev}
      >
        {'<'}
      </button>
      {weeks.map(({ weekNumber, start: wkStart, end: wkEnd }) => (
        <button
          type="button"
          key={weekNumber}
          className={`px-3 py-1 rounded border text-xs font-medium ${format(wkStart, 'yyyy-MM-dd') === format(new Date(start), 'yyyy-MM-dd') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => onChange({ start: format(wkStart, 'yyyy-MM-dd'), end: format(wkEnd, 'yyyy-MM-dd') })}
        >
          Week {weekNumber}
        </button>
      ))}
      <button
        type="button"
        className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 border"
        onClick={handleNext}
      >
        {'>'}
      </button>
    </div>
  )
}

export const DateRangeContextMenu: React.FC<Props> = ({
  open,
  x,
  y,
  start,
  end,
  rangeType,
  dayFilter,
  columnType,
  weekNumberType,
  onClose,
  onChange,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-100 border-gray-200 border rounded-xl shadow-md p-4 flex flex-col gap-2"
      style={{ left: x, top: y, minWidth: 220 }}
    >
      <div className="flex flex-col gap-2 pt-2">
        {/* Column Type Chips */}
        <div className="flex text-sm gap-[1px] bg-gray-200 rounded-xl overflow-hidden">
          {(['date', 'week', 'month', 'year'] as const).map((type) => (
            <Chip
              key={type}
              text={type.charAt(0).toUpperCase() + type.slice(1)}
              active={columnType === type}
              onClick={() => onChange({ columnType: type })}
            />
          ))}
        </div>
        {/* Range Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Range:</span>
          {(['week', 'custom'] as const).map((type) => (
            <label
              key={type}
              className="flex items-center gap-1 cursor-pointer"
            >
              <input
                type="radio"
                className="accent-blue-500"
                checked={rangeType === type}
                onChange={() => onChange({ rangeType: type })}
              />
              <span className="text-xs">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </label>
          ))}
        </div>
        {/* Week Selector for date columnType + week rangeType */}
        {columnType === 'date' && rangeType === 'week' ? (
          <WeekSelector
            start={start}
            onChange={onChange}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Start:</span>
            <input
              type="date"
              className="border rounded px-2 py-1 text-xs"
              value={start.slice(0, 10)}
              onChange={(e) => onChange({ start: e.target.value })}
            />
            <span className="text-xs text-gray-600">End:</span>
            <input
              type="date"
              className="border rounded px-2 py-1 text-xs"
              value={end.slice(0, 10)}
              onChange={(e) => onChange({ end: e.target.value })}
            />
          </div>
        )}

        {/* Week Number Type */}
        {columnType === 'week' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Week Number:</span>
            {(['iso', 'us'] as const).map((type) => (
              <label
                key={type}
                className="flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="radio"
                  className="accent-blue-500"
                  checked={weekNumberType === type}
                  onChange={() => onChange({ weekNumberType: type })}
                />
                <span className="text-xs">{type.toUpperCase()}</span>
              </label>
            ))}
          </div>
        )}

        {columnType === 'date' && (
          <div className="flex text-sm gap-[1px] bg-gray-200  rounded-xl overflow-hidden">
            <Chip
              text="Business days"
              active={dayFilter === 'business' || dayFilter === 'all'}
              onClick={() => {
                if (dayFilter === 'all') {
                  // Deactivate business, leave weekend
                  onChange({ dayFilter: 'weekend' })
                } else if (dayFilter === 'business') {
                  // Switch to weekend only
                  onChange({ dayFilter: 'weekend' })
                } else if (dayFilter === 'weekend') {
                  // Activate both
                  onChange({ dayFilter: 'all' })
                }
              }}
            />
            <Chip
              text="Weekends"
              active={dayFilter === 'weekend' || dayFilter === 'all'}
              onClick={() => {
                if (dayFilter === 'all') {
                  // Deactivate weekend, leave business
                  onChange({ dayFilter: 'business' })
                } else if (dayFilter === 'weekend') {
                  // Switch to business only
                  onChange({ dayFilter: 'business' })
                } else if (dayFilter === 'business') {
                  // Activate both
                  onChange({ dayFilter: 'all' })
                }
              }}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className="mt-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}
