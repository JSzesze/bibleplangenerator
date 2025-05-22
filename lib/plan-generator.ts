import bibleBooks from "@/constants/books.json"

/**
 * Represents a portion of Bible reading (book, chapter, and optionally verses)
 */
export interface ReadingPortion {
  bookCode: number
  chapter: number
  bookName?: string
  verses?: string // e.g., "1-15" or "1,5,10-12". If omitted, assume whole chapter.
}

/**
 * Schema for a precalculated daily Bible reading plan
 */
export interface PrecalculatedDailyPlanSchema {
  id: string
  name: string
  description: string
  planType: "precalculated_daily_json"
  totalPlanDays: number
  tags?: string[]
  author?: string
  version?: string
  dailyReadings: ReadingPortion[][] // Outer array for days, inner array for readings on that day.
  bookReadingCounts?: Record<number, number> // Count of readings per book
}

/**
 * Represents Bible book data
 */
export interface BookData {
  bookCode: number
  name: string
  chapters: number
  versesIn: number[]
  testament?: string
  aliases?: string[]
}

/**
 * Represents a book selection with optional start and end chapters
 */
export interface BookSelection {
  bookCode: number
  startChapter?: number
  endChapter?: number
}

export interface BibleBook {
  name: string
  chapters: number[]
  // Additional fields based on your schema
}

export interface ReadingPlan {
  title: string
  days: {
    day: number
    readings: string[]
  }[]
}

/**
 * Get Bible book data from the imported JSON file
 */
export function getBibleBookData(): BookData[] {
  return bibleBooks as BookData[]
}

/**
 * Generate a sequential Bible reading plan
 * @param params Configuration parameters for the sequential plan
 * @returns A precalculated daily reading plan
 */
export function generateSequentialPlan(params: {
  id: string
  name: string
  description: string
  booksToInclude: BookSelection[]
  chaptersPerDay?: number
  totalPlanDays?: number
  tags?: string[]
  author?: string
  version?: string
}): PrecalculatedDailyPlanSchema {
  const { id, name, description, booksToInclude, chaptersPerDay = 1, totalPlanDays, tags, author, version } = params

  const bibleData = getBibleBookData()
  const dailyReadings: ReadingPortion[][] = []
  let currentDay: ReadingPortion[] = []
  let dayCount = 0

  // Track reading counts per book
  const bookReadingCounts: Record<number, number> = {}

  // Process each book in the sequence
  for (const bookSelection of booksToInclude) {
    const bookData = bibleData.find((book) => book.bookCode === bookSelection.bookCode)

    if (!bookData) {
      console.warn(`Book with code ${bookSelection.bookCode} not found. Skipping.`)
      continue
    }

    const startChapter = bookSelection.startChapter || 1
    const endChapter = bookSelection.endChapter || bookData.chapters

    // Process each chapter in the book
    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
      // Add the reading portion to the current day
      currentDay.push({
        bookCode: bookData.bookCode,
        chapter,
        bookName: bookData.name,
      })

      // Track reading count for this book
      if (!bookReadingCounts[bookData.bookCode]) {
        bookReadingCounts[bookData.bookCode] = 0
      }
      bookReadingCounts[bookData.bookCode]++

      // If we've reached the chapters per day, move to the next day
      if (currentDay.length >= chaptersPerDay) {
        dailyReadings.push([...currentDay])
        currentDay = []
        dayCount++

        // If we've reached the total plan days, stop
        if (totalPlanDays && dayCount >= totalPlanDays) {
          break
        }
      }
    }

    // If we've reached the total plan days, stop
    if (totalPlanDays && dayCount >= totalPlanDays) {
      break
    }
  }

  // Add any remaining readings to the last day
  if (currentDay.length > 0) {
    dailyReadings.push([...currentDay])
    dayCount++
  }

  return {
    id,
    name,
    description,
    planType: "precalculated_daily_json",
    totalPlanDays: dayCount,
    tags,
    author,
    version,
    dailyReadings,
    bookReadingCounts,
  }
}

/**
 * Generate a multi-stream Bible reading plan
 * @param params Configuration parameters for the multi-stream plan
 * @returns A precalculated daily reading plan
 */
export async function generateMultiStreamPlan(params: {
  id: string
  name: string
  description: string
  streams: { bookCodes: number[]; chaptersPerDay?: number }[]
  totalPlanDays: number
  tags?: string[]
  author?: string
  version?: string
}): Promise<PrecalculatedDailyPlanSchema> {
  const { id, name, description, streams, totalPlanDays, tags, author, version } = params

  const bibleData = getBibleBookData()
  const dailyReadings: ReadingPortion[][] = []

  // Track reading counts per book
  const bookReadingCounts: Record<number, number> = {}

  // Initialize stream positions
  const streamPositions = streams.map(() => ({
    bookIndex: 0,
    chapter: 1,
  }))

  // Generate readings for each day
  for (let day = 0; day < totalPlanDays; day++) {
    const todayReadings: ReadingPortion[] = []

    // Process each stream
    for (let streamIndex = 0; streamIndex < streams.length; streamIndex++) {
      const stream = streams[streamIndex]
      const position = streamPositions[streamIndex]
      const chaptersPerDay = stream.chaptersPerDay || 1

      // Skip if stream has no books
      if (stream.bookCodes.length === 0) continue

      // Add chapters based on chaptersPerDay setting
      for (let i = 0; i < chaptersPerDay; i++) {
        const bookCode = stream.bookCodes[position.bookIndex]
        const bookData = bibleData.find((book) => book.bookCode === bookCode)

        if (!bookData) {
          console.warn(`Book with code ${bookCode} not found in stream ${streamIndex}. Skipping.`)
          continue
        }

        // Add the reading portion
        todayReadings.push({
          bookCode: bookData.bookCode,
          chapter: position.chapter,
          bookName: bookData.name,
        })

        // Track reading count for this book
        if (!bookReadingCounts[bookData.bookCode]) {
          bookReadingCounts[bookData.bookCode] = 0
        }
        bookReadingCounts[bookData.bookCode]++

        // Advance to the next chapter
        position.chapter++

        // If we've reached the end of the book, move to the next book
        if (position.chapter > bookData.chapters) {
          position.bookIndex = (position.bookIndex + 1) % stream.bookCodes.length
          position.chapter = 1

          // If we've cycled back to the first book and there are still more chapters to add for this day,
          // break to avoid adding duplicate readings
          if (position.bookIndex === 0 && i < chaptersPerDay - 1) {
            break
          }
        }
      }
    }

    dailyReadings.push(todayReadings)
  }

  return {
    id,
    name,
    description,
    planType: "precalculated_daily_json",
    totalPlanDays,
    tags,
    author,
    version,
    dailyReadings,
    bookReadingCounts,
  }
}

/**
 * Generate a topical Bible reading plan
 * @param params Configuration parameters for the topical plan
 * @returns A precalculated daily reading plan
 */
export function generateTopicalPlan(params: {
  id: string
  name: string
  description: string
  topics: {
    name: string
    readings: { bookCode: number; chapter: number; verses?: string }[]
  }[]
  readingsPerDay?: number
  tags?: string[]
  author?: string
  version?: string
}): PrecalculatedDailyPlanSchema {
  const { id, name, description, topics, readingsPerDay = 1, tags, author, version } = params

  const bibleData = getBibleBookData()
  const dailyReadings: ReadingPortion[][] = []
  let currentDay: ReadingPortion[] = []

  // Track reading counts per book
  const bookReadingCounts: Record<number, number> = {}

  // Flatten all readings from all topics
  const allReadings: ReadingPortion[] = []

  for (const topic of topics) {
    for (const reading of topic.readings) {
      const bookData = bibleData.find((book) => book.bookCode === reading.bookCode)

      if (!bookData) {
        console.warn(`Book with code ${reading.bookCode} not found. Skipping.`)
        continue
      }

      allReadings.push({
        bookCode: reading.bookCode,
        chapter: reading.chapter,
        bookName: bookData.name,
        verses: reading.verses,
      })

      // Track reading count for this book
      if (!bookReadingCounts[bookData.bookCode]) {
        bookReadingCounts[bookData.bookCode] = 0
      }
      bookReadingCounts[bookData.bookCode]++
    }
  }

  // Distribute readings across days
  for (const reading of allReadings) {
    currentDay.push(reading)

    if (currentDay.length >= readingsPerDay) {
      dailyReadings.push([...currentDay])
      currentDay = []
    }
  }

  // Add any remaining readings to the last day
  if (currentDay.length > 0) {
    dailyReadings.push([...currentDay])
  }

  return {
    id,
    name,
    description,
    planType: "precalculated_daily_json",
    totalPlanDays: dailyReadings.length,
    tags,
    author,
    version,
    dailyReadings,
    bookReadingCounts,
  }
}

/**
 * Generate a chronological Bible reading plan
 * @param params Configuration parameters for the chronological plan
 * @returns A precalculated daily reading plan
 */
export function generateChronologicalPlan(params: {
  id: string
  name: string
  description: string
  chronologicalSequence: { bookCode: number; chapter: number; verses?: string }[]
  readingsPerDay?: number
  totalPlanDays?: number
  tags?: string[]
  author?: string
  version?: string
}): PrecalculatedDailyPlanSchema {
  const {
    id,
    name,
    description,
    chronologicalSequence,
    readingsPerDay = 1,
    totalPlanDays,
    tags,
    author,
    version,
  } = params

  const bibleData = getBibleBookData()
  const dailyReadings: ReadingPortion[][] = []
  let currentDay: ReadingPortion[] = []
  let dayCount = 0

  // Track reading counts per book
  const bookReadingCounts: Record<number, number> = {}

  for (const item of chronologicalSequence) {
    const bookData = bibleData.find((book) => book.bookCode === item.bookCode)

    if (!bookData) {
      console.warn(`Book with code ${item.bookCode} not found. Skipping.`)
      continue
    }

    currentDay.push({
      bookCode: item.bookCode,
      chapter: item.chapter,
      bookName: bookData.name,
      verses: item.verses,
    })

    // Track reading count for this book
    if (!bookReadingCounts[bookData.bookCode]) {
      bookReadingCounts[bookData.bookCode] = 0
    }
    bookReadingCounts[bookData.bookCode]++

    if (currentDay.length >= readingsPerDay) {
      dailyReadings.push([...currentDay])
      currentDay = []
      dayCount++

      if (totalPlanDays && dayCount >= totalPlanDays) {
        break
      }
    }
  }

  // Add any remaining readings to the last day
  if (currentDay.length > 0) {
    dailyReadings.push([...currentDay])
    dayCount++
  }

  return {
    id,
    name,
    description,
    planType: "precalculated_daily_json",
    totalPlanDays: dayCount,
    tags,
    author,
    version,
    dailyReadings,
    bookReadingCounts,
  }
}

/**
 * Save a reading plan to a JSON file
 * @param plan The reading plan to save
 * @param filePath The file path to save to
 */
export function savePlanToJson(plan: PrecalculatedDailyPlanSchema): string {
  return JSON.stringify(plan, null, 2)
}

/**
 * Calculate repetition statistics for a reading plan
 * @param plan The reading plan to analyze
 * @returns Object with repetition statistics
 */
export function calculatePlanStatistics(plan: PrecalculatedDailyPlanSchema) {
  const bibleData = bibleBooks as BookData[]
  const bookReadingCounts = plan.bookReadingCounts || {}

  // Group books by testament and category
  const otBooks = bibleData.filter((book) => book.testament === "OT" && ![18, 19, 20, 21, 22].includes(book.bookCode))
  const ntBooks = bibleData.filter((book) => book.testament === "NT")
  const wisdomBooks = bibleData.filter((book) => [18, 19, 20, 21, 22].includes(book.bookCode))

  // Calculate total chapters in each category
  const otChapters = otBooks.reduce((sum, book) => sum + book.chapters, 0)
  const ntChapters = ntBooks.reduce((sum, book) => sum + book.chapters, 0)
  const wisdomChapters = wisdomBooks.reduce((sum, book) => sum + book.chapters, 0)

  // Calculate total readings in each category
  const otReadings = otBooks.reduce((sum, book) => sum + (bookReadingCounts[book.bookCode] || 0), 0)
  const ntReadings = ntBooks.reduce((sum, book) => sum + (bookReadingCounts[book.bookCode] || 0), 0)
  const wisdomReadings = wisdomBooks.reduce((sum, book) => sum + (bookReadingCounts[book.bookCode] || 0), 0)

  // Calculate repetition factors
  const otRepetition = otChapters > 0 ? otReadings / otChapters : 0
  const ntRepetition = ntChapters > 0 ? ntReadings / ntChapters : 0
  const wisdomRepetition = wisdomChapters > 0 ? wisdomReadings / wisdomChapters : 0

  return {
    oldTestament: {
      chapters: otChapters,
      readings: otReadings,
      repetition: otRepetition.toFixed(1),
    },
    newTestament: {
      chapters: ntChapters,
      readings: ntReadings,
      repetition: ntRepetition.toFixed(1),
    },
    wisdomBooks: {
      chapters: wisdomChapters,
      readings: wisdomReadings,
      repetition: wisdomRepetition.toFixed(1),
    },
    bookReadings: Object.entries(bookReadingCounts).reduce(
      (acc, [bookCode, count]) => {
        const book = bibleData.find((b) => b.bookCode === Number(bookCode))
        if (book) {
          acc[book.name] = count
        }
        return acc
      },
      {} as Record<string, number>,
    ),
  }
}
