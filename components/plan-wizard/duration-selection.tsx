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
  const [durationType, setDurationType] = useState(duration.type)
  const [durationValue, setDurationValue] = useState(duration.value)
  const [customInput, setCustomInput] = useState(duration.value.toString())
  const [weeklyStats, setWeeklyStats] = useState({ minutes: 0, chapters: 0 })
  const [endDate, setEndDate] = useState("")
  const [inputMode, setInputMode] = useState<"preset" | "slider" | "custom">("preset")

  // Duration type configurations
  const durationTypes = [
    { key: "days", label: "Days", min: 7, max: 1095, step: 1, recommended: [30, 90, 180, 365] },
    { key: "weeks", label: "Weeks", min: 1, max: 156, step: 1, recommended: [4, 12, 26, 52] },
    { key: "months", label: "Months", min: 1, max: 36, step: 1, recommended: [1, 3, 6, 12] },
    { key: "years", label: "Years", min: 1, max: 3, step: 1, recommended: [1, 2, 3] },
  ]

  const currentTypeConfig = durationTypes.find(t => t.key === durationType) || durationTypes[1]

  // Quick preset options based on reading type
  const getQuickPresets = () => {
    if (readingType === "preset" || readingType === "stream-by-stream") {
      return [
        { label: "30 Days", type: "days", value: 30 },
        { label: "90 Days", type: "days", value: 90 },
        { label: "6 Months", type: "months", value: 6 },
        { label: "1 Year", type: "months", value: 12 },
      ]
    }
    
    if (section === "new-testament") {
      return [
        { label: "30 Days", type: "days", value: 30 },
        { label: "90 Days", type: "days", value: 90 },
        { label: "6 Months", type: "months", value: 6 },
      ]
    }
    
    if (section === "psalms") {
      return [
        { label: "30 Days", type: "days", value: 30 },
        { label: "5 Months", type: "months", value: 5 },
        { label: "1 Year", type: "months", value: 12 },
      ]
    }
    
    // Default for whole Bible or OT
    return [
      { label: "6 Months", type: "months", value: 6 },
      { label: "1 Year", type: "months", value: 12 },
      { label: "18 Months", type: "months", value: 18 },
      { label: "2 Years", type: "years", value: 2 },
    ]
  }

  // Calculate weekly stats based on section and duration
  useEffect(() => {
    let totalChapters = 0

    if (readingType === "preset" || readingType === "stream-by-stream") {
      if (presetName?.includes("Horner")) {
        totalChapters = 10 * 52 // 10 chapters per day
      } else if (presetName?.includes("M'Cheyne")) {
        totalChapters = 4 * 52 // 4 chapters per day
      } else {
        totalChapters = 5 * 52 // 5 chapters per day
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

    // Convert duration to days
    let totalDays = durationValue
    if (durationType === "weeks") totalDays = durationValue * 7
    else if (durationType === "months") totalDays = Math.round(durationValue * 365.25 / 12) // More accurate month conversion
    else if (durationType === "years") totalDays = Math.round(durationValue * 365.25) // Account for leap years

    // Calculate chapters per week
    const chaptersPerDay = totalChapters / totalDays
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
    endDateValue.setDate(today.getDate() + totalDays)

    setEndDate(
      `${endDateValue.getDate()} ${endDateValue.toLocaleString("default", { month: "long" })} ${endDateValue.getFullYear()}`,
    )
  }, [section, durationType, durationValue, readingType, presetName, selectedBooks])

  const handleDurationTypeChange = (type: string) => {
    const newTypeConfig = durationTypes.find(t => t.key === type)
    if (newTypeConfig) {
      // Convert current value to new type approximately
      let newValue = durationValue
      if (durationType === "days" && type === "weeks") newValue = Math.round(durationValue / 7)
      else if (durationType === "days" && type === "months") newValue = Math.round(durationValue * 12 / 365.25)
      else if (durationType === "days" && type === "years") newValue = Math.round(durationValue / 365.25)
      else if (durationType === "weeks" && type === "days") newValue = durationValue * 7
      else if (durationType === "weeks" && type === "months") newValue = Math.round(durationValue * 12 / 52.18)
      else if (durationType === "weeks" && type === "years") newValue = Math.round(durationValue / 52.18)
      else if (durationType === "months" && type === "days") newValue = Math.round(durationValue * 365.25 / 12)
      else if (durationType === "months" && type === "weeks") newValue = Math.round(durationValue * 365.25 / 12 / 7)
      else if (durationType === "months" && type === "years") newValue = Math.round(durationValue / 12)
      else if (durationType === "years" && type === "days") newValue = Math.round(durationValue * 365.25)
      else if (durationType === "years" && type === "weeks") newValue = Math.round(durationValue * 52.18)
      else if (durationType === "years" && type === "months") newValue = durationValue * 12

      // Clamp to valid range
      newValue = Math.max(newTypeConfig.min, Math.min(newTypeConfig.max, newValue))
      
      setDurationType(type)
      setDurationValue(newValue)
      setCustomInput(newValue.toString())
      onChange({ type, value: newValue })
    }
  }

  const handleDurationValueChange = (value: number) => {
    const clampedValue = Math.max(currentTypeConfig.min, Math.min(currentTypeConfig.max, value))
    setDurationValue(clampedValue)
    setCustomInput(clampedValue.toString())
    onChange({ type: durationType, value: clampedValue })
  }

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value)
    const numValue = parseInt(value) || currentTypeConfig.min
    const clampedValue = Math.max(currentTypeConfig.min, Math.min(currentTypeConfig.max, numValue))
    setDurationValue(clampedValue)
    onChange({ type: durationType, value: clampedValue })
  }

  const handlePresetClick = (preset: { label: string; type: string; value: number }) => {
    setDurationType(preset.type)
    setDurationValue(preset.value)
    setCustomInput(preset.value.toString())
    onChange({ type: preset.type, value: preset.value })
    setInputMode("preset")
  }

  const getPageTitle = () => {
    if (readingType === "preset" || readingType === "stream-by-stream") {
      return `How long should your\n${presetName || "reading plan"} be?`
    }
    return "How long should your\nreading plan be?"
  }

  const quickPresets = getQuickPresets()

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8 whitespace-pre-line">{getPageTitle()}</h1>

      {/* Quick Presets */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 text-center mb-4">Popular choices</div>
        <div className="grid grid-cols-2 gap-3">
          {quickPresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              className={cn(
                "h-12 border-gray-700 hover:bg-gray-800",
                durationType === preset.type && durationValue === preset.value && "border-white bg-gray-800"
              )}
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration Type Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-800 rounded-full p-1">
          {durationTypes.map((type) => (
            <Button
              key={type.key}
              variant="ghost"
              className={cn("rounded-full px-4 text-sm", durationType === type.key && "bg-gray-700")}
              onClick={() => handleDurationTypeChange(type.key)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-900 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-xs", inputMode === "slider" && "bg-gray-700")}
            onClick={() => setInputMode("slider")}
          >
            Slider
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-xs", inputMode === "custom" && "bg-gray-700")}
            onClick={() => setInputMode("custom")}
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Input Controls */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        {inputMode === "slider" && (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{durationValue}</div>
              <div className="text-lg text-gray-400">{durationType}</div>
            </div>
            <Slider
              value={[durationValue]}
              onValueChange={(values) => handleDurationValueChange(values[0])}
              min={currentTypeConfig.min}
              max={currentTypeConfig.max}
              step={currentTypeConfig.step}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentTypeConfig.min}</span>
              <span>{currentTypeConfig.max}</span>
            </div>
          </div>
        )}

        {inputMode === "custom" && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                value={customInput}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                min={currentTypeConfig.min}
                max={currentTypeConfig.max}
                className="text-center text-2xl h-16 bg-gray-800 border-gray-700"
                placeholder={currentTypeConfig.min.toString()}
              />
              <div className="text-xl text-gray-400">{durationType}</div>
            </div>
            <div className="text-center text-sm text-gray-500">
              Range: {currentTypeConfig.min} - {currentTypeConfig.max} {durationType}
            </div>
          </div>
        )}

        {/* Recommended values for current type */}
        {inputMode !== "preset" && currentTypeConfig.recommended.length > 0 && (
          <div className="mt-6 w-full max-w-md">
            <div className="text-xs text-gray-500 text-center mb-2">Recommended</div>
            <div className="flex justify-center space-x-2">
              {currentTypeConfig.recommended.map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-xs border border-gray-700",
                    durationValue === value && "border-white bg-gray-800"
                  )}
                  onClick={() => handleDurationValueChange(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="bg-gray-900 border-gray-800 p-4 text-center">
          <Clock className="h-4 w-4 mx-auto mb-2 text-gray-400" />
          <div className="text-lg font-bold">{weeklyStats.minutes}</div>
          <div className="text-xs text-gray-400">min/week</div>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800 p-4 text-center">
          <Target className="h-4 w-4 mx-auto mb-2 text-gray-400" />
          <div className="text-lg font-bold">{weeklyStats.chapters}</div>
          <div className="text-xs text-gray-400">chapters/week</div>
        </Card>
        
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
            duration: { type: durationType, value: durationValue },
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
