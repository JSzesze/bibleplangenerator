"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import bibleBooks from "@/constants/books.json"
import type { PrecalculatedDailyPlanSchema } from "@/lib/plan-generator"

interface VersesPerDayGraphProps {
  plan: PrecalculatedDailyPlanSchema
  showDays?: number // Number of days to show in the graph
}

export default function VersesPerDayGraph({ plan, showDays = 30 }: VersesPerDayGraphProps) {
  // Calculate verses per day
  const versesPerDay = useMemo(() => {
    return plan.dailyReadings.map((day) => {
      return day.reduce((total, reading) => {
        const book = bibleBooks.find((b: any) => b.bookCode === reading.bookCode)
        if (!book) return total

        // If verses are specified, count them
        if (reading.verses) {
          let verseCount = 0
          const verseParts = reading.verses.split(",")

          verseParts.forEach((part) => {
            if (part.includes("-")) {
              const [start, end] = part.split("-").map((v) => Number.parseInt(v))
              verseCount += end - start + 1
            } else {
              verseCount += 1
            }
          })

          return total + verseCount
        }

        // Otherwise, use the whole chapter
        return total + (book.versesIn[reading.chapter - 1] || 0)
      }, 0)
    })
  }, [plan])

  // Calculate statistics
  const stats = useMemo(() => {
    if (versesPerDay.length === 0) return { avg: 0, min: 0, max: 0 }

    const sum = versesPerDay.reduce((a, b) => a + b, 0)
    return {
      avg: Math.round(sum / versesPerDay.length),
      min: Math.min(...versesPerDay),
      max: Math.max(...versesPerDay),
    }
  }, [versesPerDay])

  // Limit days to display
  const displayDays = Math.min(showDays, versesPerDay.length)
  const displayData = versesPerDay.slice(0, displayDays)

  // Find max value for scaling
  const maxValue = Math.max(...displayData)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Verses Per Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-end space-x-1">
          {displayData.map((verses, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-600 hover:bg-blue-500 transition-colors rounded-sm relative group"
              style={{ height: `${Math.max(5, (verses / maxValue) * 100)}%` }}
            >
              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Day {index + 1}: {verses} verses
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <div>Day 1</div>
          <div>Day {displayDays}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-xs text-gray-400">Average</div>
            <div className="text-lg font-bold">{stats.avg}</div>
            <div className="text-xs text-gray-400">verses</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-xs text-gray-400">Minimum</div>
            <div className="text-lg font-bold">{stats.min}</div>
            <div className="text-xs text-gray-400">verses</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-xs text-gray-400">Maximum</div>
            <div className="text-lg font-bold">{stats.max}</div>
            <div className="text-xs text-gray-400">verses</div>
          </div>
        </div>

        {versesPerDay.length > displayDays && (
          <div className="text-center text-xs text-gray-400 mt-4">
            Showing first {displayDays} of {versesPerDay.length} days
          </div>
        )}
      </CardContent>
    </Card>
  )
}
