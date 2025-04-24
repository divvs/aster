import { PGlite } from '@electric-sql/pglite'
import { endOfWeek, format, formatISO, startOfWeek } from 'date-fns'
import React from 'react'
import { useState } from 'react'
import { createStore } from 'tinybase'
import { createPglitePersister } from 'tinybase/persisters/persister-pglite'
import {
  Provider,
  useCell,
  useCreatePersister,
  useCreateStore,
} from 'tinybase/ui-react'
import { Inspector } from 'tinybase/ui-react-inspector'
import { CalendarGrid } from './CalendarGrid'
import { DateRangeColumns } from './DateRangeColumns'
import { DateRangeContextMenu } from './DateRangeContextMenu'
import { HoursColumn } from './HoursColumn'

import type { ColumnType, WeekNumberType } from './DateRangeColumns.types'

function App() {
  // WeekStart can be 'monday' or 'sunday'
  const DEFAULT_WEEK_START: 'monday' | 'sunday' = 'monday'
  const WEEK_START_MAP = { monday: 1, sunday: 0 } as const

  // Compute defaults ONCE for both fallback and initialization
  const now = new Date()
  const defaultWeekStart = DEFAULT_WEEK_START
  const defaultStart = formatISO(
    startOfWeek(now, { weekStartsOn: WEEK_START_MAP[defaultWeekStart] }),
    { representation: 'date' },
  )
  const defaultEnd = formatISO(
    endOfWeek(now, { weekStartsOn: WEEK_START_MAP[defaultWeekStart] }),
    { representation: 'date' },
  )
  const [columnType, setColumnType] = useState<ColumnType>('date')
  const [weekNumberType, setWeekNumberType] = useState<WeekNumberType>('iso')

  // Per-columnType state: rangeType, start, end, numColumns
  const [columnStates, setColumnStates] = useState<
    Record<
      ColumnType,
      {
        rangeType: 'week' | 'custom'
        start: string
        end: string
        numColumns: number
      }
    >
  >({
    date: {
      rangeType: 'custom',
      start: defaultStart,
      end: defaultEnd,
      numColumns: 7,
    },
    week: {
      rangeType: 'week',
      start: defaultStart,
      end: defaultEnd,
      numColumns: 4,
    },
    month: {
      rangeType: 'custom',
      start: defaultStart,
      end: defaultEnd,
      numColumns: 3,
    },
    year: {
      rangeType: 'custom',
      start: defaultStart,
      end: defaultEnd,
      numColumns: 2,
    },
  })

  // Helper: get current state for active columnType
  const currentState = columnStates[columnType]
  const { rangeType, start, end, numColumns } = currentState

  const [initializing, setInitializing] = useState(true)
  const store = useCreateStore(createStore)

  useCreatePersister(store, async (store) => {
    const pglite = await PGlite.create('idb://aster')
    const persister = await createPglitePersister(store, pglite)
    await persister.startAutoLoad()
    // Now check for missing values and set them if needed
    const row = store.getRow('timeline', 'current') ?? {}
    if (!row.start) {
      store.setCell('timeline', 'current', 'start', defaultStart)
    }
    if (!row.end) {
      store.setCell('timeline', 'current', 'end', defaultEnd)
    }
    if (!row.weekStart) {
      store.setCell('timeline', 'current', 'weekStart', defaultWeekStart)
    }
    await persister.startAutoSave()
    setInitializing(false)
    return persister
  })

  // Read values from store reactively
  const dayFilter =
    (useCell('timeline', 'current', 'dayFilter', store) as
      | 'all'
      | 'business'
      | 'weekend') || 'all'

  const [menu, setMenu] = React.useState<{
    open: boolean
    x: number
    y: number
  }>({ open: false, x: 0, y: 0 })

  // Handler for context menu
  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ open: true, x: e.clientX, y: e.clientY })
  }, [])

  // Helper: calculate new start/end for target columnType given previous state
  function calcRangeForType(
    prevType: ColumnType,
    prevState: { start: string; end: string; numColumns: number },
    targetType: ColumnType,
  ) {
    const prevStart = new Date(prevState.start)
    const start = prevState.start
    let end = prevState.end
    const numColumns = prevState.numColumns
    if (prevType === targetType) return { start, end, numColumns }
    // Map numColumns and range to target type
    if (targetType === 'date') {
      // 1 day per column
      end = formatISO(
        new Date(prevStart.getTime() + (numColumns - 1) * 24 * 3600 * 1000),
        { representation: 'date' },
      )
    } else if (targetType === 'week') {
      // 1 week per column
      end = formatISO(
        new Date(prevStart.getTime() + (numColumns - 1) * 7 * 24 * 3600 * 1000),
        { representation: 'date' },
      )
    } else if (targetType === 'month') {
      // 1 month per column
      const s = new Date(prevStart)
      s.setMonth(s.getMonth() + numColumns - 1)
      end = formatISO(s, { representation: 'date' })
    } else if (targetType === 'year') {
      // 1 year per column
      const s = new Date(prevStart)
      s.setFullYear(s.getFullYear() + numColumns - 1)
      end = formatISO(s, { representation: 'date' })
    }
    return { start, end, numColumns }
  }

  const handleMenuChange = (vals: {
    start?: string
    end?: string
    rangeType?: 'week' | 'custom'
    dayFilter?: 'all' | 'business' | 'weekend'
    columnType?: ColumnType
    weekNumberType?: WeekNumberType
    numColumns?: number
  }) => {
    // If switching columnType, copy numColumns and range from previous type
    if (vals.columnType && vals.columnType !== columnType) {
      setColumnType(vals.columnType)
      setColumnStates((prev) => {
        const prevState = prev[columnType]
        const newRange = calcRangeForType(
          columnType,
          prevState,
          vals.columnType!,
        )
        return {
          ...prev,
          [vals.columnType!]: {
            ...prev[vals.columnType!],
            start: newRange.start,
            end: newRange.end,
            numColumns: newRange.numColumns,
          },
        }
      })
      return
    }
    // Update current columnType's state
    setColumnStates((prev) => ({
      ...prev,
      [columnType]: {
        ...prev[columnType],
        ...(vals.start ? { start: vals.start } : {}),
        ...(vals.end ? { end: vals.end } : {}),
        ...(vals.rangeType ? { rangeType: vals.rangeType } : {}),
        ...(vals.numColumns ? { numColumns: vals.numColumns } : {}),
      },
    }))
    if (vals.weekNumberType && vals.weekNumberType !== weekNumberType) {
      setWeekNumberType(vals.weekNumberType)
    }
    if (vals.dayFilter && vals.dayFilter !== dayFilter) {
      store.setCell('timeline', 'current', 'dayFilter', vals.dayFilter)
    }
  }

  return (
    <Provider store={store}>
      {initializing ? (
        <div>Loading...</div>
      ) : (
        <div className="absolute inset-0 flex flex-col gap-2 bg-[#EFEFEF] px-8 pb-2">
          <div
            onContextMenu={handleContextMenu}
            className="cursor-context-menu select-none grid gap-1 grid-cols-3"
          >
            <div>{/* Column Type Chip Selector */}</div>
            <div className="flex flex-col items-center justify-center leading-none p-2">
              <div className="flex items-center gap-1 text-[10px]">
                <b>Date Range:</b>
                <span>
                  {columnType.charAt(0).toUpperCase() + columnType.slice(1)}
                </span>
              </div>
              <div className="text-sm">
                {format(start, 'MMMM dd')}-{format(end, 'MMMM dd')}
              </div>
            </div>

            <div></div>
          </div>

          {/* Only show HoursColumn + CalendarGrid for 'date' column type */}
          {columnType === 'date' ? (
            <div className="relative flex w-full h-full z-50">
              <HoursColumn
                columnType={columnType}
                start={start}
                end={end}
                columnSegments={24}
                labelHeight={40}
              />
              <CalendarGrid numColumns={numColumns} numRows={24}>
                <DateRangeColumns
                  start={start}
                  end={end}
                  dayFilter={dayFilter}
                  columnType={columnType}
                  weekNumberType={weekNumberType}
                />
              </CalendarGrid>
            </div>
          ) : (
            // For week/month/year, just render DateRangeColumns (which now renders columns with event lists)
            <div className="relative flex w-full h-full z-50">
              <DateRangeColumns
                start={start}
                end={end}
                dayFilter={dayFilter}
                columnType={columnType}
                weekNumberType={weekNumberType}
              />
            </div>
          )}
          <DateRangeContextMenu
            open={menu.open}
            x={menu.x}
            y={menu.y}
            start={start}
            end={end}
            rangeType={rangeType}
            dayFilter={dayFilter}
            columnType={columnType}
            weekNumberType={weekNumberType}
            onClose={() => setMenu((m) => ({ ...m, open: false }))}
            onChange={handleMenuChange}
          />
        </div>
      )}
      <Inspector />
    </Provider>
  )
}

export default App
