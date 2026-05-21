const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekdayKeys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function toLocalDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  if (!dateKey) {
    return toLocalDate(new Date())
  }

  const [year, month, day] = dateKey.split('-').map(Number)

  if (!year || !month || !day) {
    return toLocalDate(new Date())
  }

  return new Date(year, month - 1, day)
}

export function getWeekStartDate(date, weekStartDay = 'MON') {
  const localDate = toLocalDate(date)
  const startDayIndex = weekdayKeys.indexOf(weekStartDay)
  const safeStartDayIndex = startDayIndex >= 0 ? startDayIndex : 1
  const dayDifference =
    (localDate.getDay() - safeStartDayIndex + weekdayKeys.length) %
    weekdayKeys.length

  localDate.setDate(localDate.getDate() - dayDifference)

  return localDate
}

export function getCurrentWeekKey(weekStartDay = 'MON') {
  return formatDateKey(getWeekStartDate(new Date(), weekStartDay))
}

export function shiftWeekKey(weekKey, numberOfWeeks) {
  const date = parseDateKey(weekKey)

  date.setDate(date.getDate() + numberOfWeeks * 7)

  return formatDateKey(date)
}

export function getDisplayDaysForWeek(weekKey) {
  const weekStartDate = parseDateKey(weekKey)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + index)

    const todayKey = formatDateKey(new Date())

    return {
      weekday: weekdayKeys[date.getDay()],
      dayName: dayNames[date.getDay()],
      date: String(date.getDate()),
      dateKey: formatDateKey(date),
      isToday: formatDateKey(date) === todayKey,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
      },
    }
  })
}

export function formatPlannerWeekRange(days) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  return `${firstDay.dayName} ${firstDay.date} - ${lastDay.dayName} ${lastDay.date}`
}
