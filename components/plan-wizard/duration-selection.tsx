"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import bibleBooks from "@/constants/books.json"
import ReadingPlanPreview from "./reading-plan-preview"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, Target } from "lucide-react"

interface DurationSelectionProps {
  duration: {
    type: string
    value: number
  }
  onChange: (duration: { type: string; value: number }) => void
  section: string
  pathway: string
  readingType: string
  presetName?: string
  selectedBooks: number[]
}

export default function DurationSelection({
  duration,
  onChange,
  section,
  pathway,
  readingType,
  presetName,
  selectedBooks,
}: DurationSelectionProps) {
  // Only use days as the unit
  const [durationValue, setDurationValue] = useState(duration.value)
  const [weeklyStats, setWeeklyStats] = useState({ minutes: 0, chapters: 0 })
  const [endDate, setEndDate] = useState("")

  // Preset options in days
  const presets = [30, 90, 180, 365]
  const minDays = 7
  const maxDays = 730

  // Calculate weekly stats based on section and duration
  useEffect(() => {
    let totalChapters = 0
    if (readingType === "preset" || readingType === "stream-by-stream") {
      if (presetName?.includes("Horner")) {
        totalChapters = 10 * 52
      } else if (presetName?.includes("M'Cheyne")) {
        totalChapters = 4 * 52
      } else {
        totalChapters = 5 * 52
      }
    } else if (section === "old-testament") {
      totalChapters = bibleBooks
        .filter((book: any) => book.testament === "OT")
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else if (section === "new-testament") {
      totalChapters = bibleBooks
        .filter((book: any) => book.testament === "NT")
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else if (section === "psalms") {
      totalChapters = 150
    } else if (section === "gospels") {
      totalChapters = bibleBooks
        .filter((book: any) => book.bookCode >= 40 && book.bookCode <= 43)
        .reduce((sum: number, book: any) => sum + book.chapters, 0)
    } else {
      totalChapters = bibleBooks.reduce((sum: number, book: any) => sum + book.chapters, 0)
    }

    // Calculate chapters per week
    const chaptersPerDay = totalChapters / durationValue
    const chaptersPerWeek = chaptersPerDay * 7
    // Estimate reading time (average 2.5 minutes per chapter)
    const minutesPerWeek = chaptersPerWeek * 2.5
    setWeeklyStats({
      minutes: Math.round(minutesPerWeek),
      chapters: Math.round(chaptersPerWeek),
    })

    // Calculate end date
    const today = new Date()
    const endDateValue = new Date(today)
    endDateValue.setDate(today.getDate() + durationValue)
    setEndDate(
      `${endDateValue.getDate()} ${endDateValue.toLocaleString("default", { month: "long" })} ${endDateValue.getFullYear()}`,
    )
  }, [section, durationValue, readingType, presetName, selectedBooks])

  const handlePresetClick = (days: number) => {
    setDurationValue(days)
    onChange({ type: "days", value: days })
  }

  const handleSliderChange = (value: number) => {
    setDurationValue(value)
    onChange({ type: "days", value })
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">How long should your reading plan be?</h1>

      {/* Preset Options */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 text-center mb-4">Popular choices</div>
        <div className="grid grid-cols-4 gap-3">
          {presets.map((days) => (
            <Button
              key={days}
              variant="outline"
              className={cn(
                "h-12 border-gray-700 hover:bg-gray-800",
                durationValue === days && "border-white bg-gray-800"
              )}
              onClick={() => handlePresetClick(days)}
            >
              {days} Days
            </Button>
          ))}
        </div>
      </div>

      {/* Centered Day Value and Slider */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{durationValue}</div>
            <div className="text-lg text-gray-400">days</div>
          </div>
          <Slider
            value={[durationValue]}
            onValueChange={(values) => handleSliderChange(values[0])}
            min={minDays}
            max={maxDays}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{minDays}</span>
            <span>{maxDays}</span>
          </div>
        </div>
      </div>

      {/* End Date Card at the Bottom */}
      <div className="w-full max-w-md mx-auto mb-8 mt-auto">
        <Card className="bg-gray-900 border-gray-800 p-4 text-center">
          <Calendar className="h-4 w-4 mx-auto mb-2 text-gray-400" />
          <div className="text-lg font-bold">{endDate.split(" ")[0]}</div>
          <div className="text-xs text-gray-400">{endDate.split(" ")[1]} {endDate.split(" ")[2]}</div>
        </Card>
      </div>

      {/* Preview */}
      <div className="mt-auto">
        <ReadingPlanPreview
          config={{
            readingType: readingType,
            duration: { type: "days", value: durationValue },
            wholeBibleConfig: {
              newTestamentPlacement: "alongside",
              wisdomBooksPlacement: "alongside",
              includedWisdomBooks: [],
            },
            sectionConfig:
              readingType === "section"
                ? {
                    section,
                    pathway,
                    selectedBooks,
                  }
                : undefined,
          }}
          showOnlyOnFinal={true}
        />
      </div>
    </div>
  )
}
