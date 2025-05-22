"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReadingPlanPreview from "./reading-plan-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TimelineVisualization from "./timeline-visualization"
import { getBookCodesByTestament, getBookCodesByDivision, getBookByCode, getWisdomBookCodes } from "@/lib/book-utils"

interface WholeBibleFlowProps {
  onComplete: (config: WholeBibleConfig) => void
  onBack: () => void
  duration: {
    type: string
    value: number
  }
}

export interface WholeBibleConfig {
  newTestamentPlacement: "alongside" | "after"
  wisdomBooksPlacement: "alongside" | "within"
  includedWisdomBooks: string[]
}

interface WisdomBooksSelectorProps {
  selectedBooks: string[]
  onComplete: (selectedBooks: string[]) => void
  onCancel: () => void
}

export default function WholeBibleFlow({ onComplete, onBack, duration }: WholeBibleFlowProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<WholeBibleConfig>({
    newTestamentPlacement: "alongside",
    wisdomBooksPlacement: "alongside",
    includedWisdomBooks: ["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Job"],
  })
  const [showWisdomSelector, setShowWisdomSelector] = useState(false)

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      onComplete(config)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      onBack()
    }
  }

  const updateConfig = (key: keyof WholeBibleConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleWisdomSelectorComplete = (selectedBooks: string[]) => {
    updateConfig("includedWisdomBooks", selectedBooks)
    setShowWisdomSelector(false)
  }

  // If no wisdom books are selected but placement is not "within", show a warning
  const showWisdomWarning = config.includedWisdomBooks.length === 0 && config.wisdomBooksPlacement !== "within"

  // If wisdom books placement is "within", disable the selector button
  const wisdomSelectorDisabled = config.wisdomBooksPlacement === "within"

  if (showWisdomSelector) {
    return (
      <WisdomBooksSelector
        selectedBooks={config.includedWisdomBooks}
        onComplete={handleWisdomSelectorComplete}
        onCancel={() => setShowWisdomSelector(false)}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {step === 1 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            How do you want to read
            <br />
            the New Testament?
          </h1>

          <TimelineVisualization
            streams={getWholeBibleTimelineStreams({
              newTestamentPlacement: config.newTestamentPlacement,
              wisdomBooksPlacement: "within", // Not relevant for this step
              includedWisdomBooks: [],
            })}
          />

          <div className="space-y-4 mt-10">
            <ReadingOptionButton
              label="Alongside the Old Testament"
              description="Read OT and NT passages each day"
              isSelected={config.newTestamentPlacement === "alongside"}
              onClick={() => updateConfig("newTestamentPlacement", "alongside")}
            />

            <ReadingOptionButton
              label="After the Old Testament"
              description="Finish the OT before starting the NT"
              isSelected={config.newTestamentPlacement === "after"}
              onClick={() => updateConfig("newTestamentPlacement", "after")}
            />
          </div>

          <div className="mt-6">
            <ReadingPlanPreview
              config={{
                readingType: "whole",
                duration,
                wholeBibleConfig: config,
              }}
              showOnlyOnFinal={true}
            />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            How do you want to read
            <br />
            the wisdom books?
          </h1>

          <TimelineVisualization
            streams={getWholeBibleTimelineStreams({
              newTestamentPlacement: config.newTestamentPlacement,
              wisdomBooksPlacement: config.wisdomBooksPlacement,
              includedWisdomBooks: config.includedWisdomBooks,
            })}
          />

          <div className="space-y-4 mt-10">
            <ReadingOptionButton
              label="Alongside the Old Testament"
              description="Read wisdom books as a separate stream"
              isSelected={config.wisdomBooksPlacement === "alongside"}
              onClick={() => {
                updateConfig("wisdomBooksPlacement", "alongside")
                // If switching to "alongside" and no wisdom books are selected, select all by default
                if (config.includedWisdomBooks.length === 0) {
                  updateConfig("includedWisdomBooks", ["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Job"])
                }
              }}
            />

            <ReadingOptionButton
              label="Within the Old Testament"
              description="Read wisdom books in their canonical order"
              isSelected={config.wisdomBooksPlacement === "within"}
              onClick={() => updateConfig("wisdomBooksPlacement", "within")}
            />

            <Button
              variant="outline"
              className={cn(
                "w-full h-auto py-4 px-4 flex items-center justify-between text-lg border-gray-700 hover:bg-gray-800",
                wisdomSelectorDisabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={() => !wisdomSelectorDisabled && setShowWisdomSelector(true)}
              disabled={wisdomSelectorDisabled}
            >
              <span>
                {wisdomSelectorDisabled
                  ? "All wisdom books included in OT"
                  : `Choose what's included (${config.includedWisdomBooks.length} books selected)`}
              </span>
              {!wisdomSelectorDisabled && <ChevronRight className="h-5 w-5" />}
            </Button>

            {showWisdomWarning && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one wisdom book or change the placement to "within the Old Testament".
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mt-6">
            <ReadingPlanPreview
              config={{
                readingType: "whole",
                duration,
                wholeBibleConfig: config,
              }}
              showOnlyOnFinal={true}
            />
          </div>
        </>
      )}

      <div className="mt-auto pt-4">
        <div className="w-full bg-gray-800 h-1 mb-4 rounded-full overflow-hidden">
          <div className="bg-white h-full" style={{ width: `${(step / 2) * 100}%` }}></div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext} className="bg-white text-black hover:bg-gray-200" disabled={showWisdomWarning}>
            {step === 2 ? "Next" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ReadingOptionButtonProps {
  label: string
  description?: string
  isSelected: boolean
  onClick: () => void
}

function ReadingOptionButton({ label, description, isSelected, onClick }: ReadingOptionButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-auto py-4 px-4 flex items-center justify-between border-gray-700 hover:bg-gray-800",
        isSelected && "border-white bg-gray-800",
      )}
      onClick={onClick}
    >
      <div className="text-left">
        <div className="text-lg">{label}</div>
        {description && <div className="text-sm text-gray-400">{description}</div>}
      </div>
      <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center ml-4">
        {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
      </div>
    </Button>
  )
}

function WisdomBooksSelector({ selectedBooks, onComplete, onCancel }: WisdomBooksSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedBooks)

  // Canonical wisdom book codes and names from book-utils
  const wisdomBookCodes = getWisdomBookCodes()
  const wisdomBooks = wisdomBookCodes
    .map((code) => getBookByCode(code))
    .filter(Boolean)
    .map((book) => book!.name)

  const toggleBook = (book: string) => {
    if (selected.includes(book)) {
      setSelected(selected.filter((b) => b !== book))
    } else {
      setSelected([...selected, book])
    }
  }

  const selectAll = () => {
    setSelected([...wisdomBooks])
  }

  const deselectAll = () => {
    setSelected([])
  }

  const handleSave = () => {
    onComplete(selected)
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-6">Choose wisdom books to include</h1>

      <div className="flex justify-between mb-4">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect All
        </Button>
      </div>

      <div className="space-y-4 flex-1">
        {wisdomBooks.map((book) => (
          <div key={book} className="flex items-center space-x-3 p-2 border border-gray-700 rounded-md">
            <input
              type="checkbox"
              id={`book-${book}`}
              checked={selected.includes(book)}
              onChange={() => toggleBook(book)}
              className="rounded-sm w-5 h-5"
            />
            <label htmlFor={`book-${book}`} className="text-lg flex-1">
              {book}
            </label>
          </div>
        ))}
      </div>

      {selected.length === 0 && (
        <Alert className="mt-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If no wisdom books are selected, they will all remain in their normal position within the Old Testament.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-white text-black hover:bg-gray-200">
          Save
        </Button>
      </div>
    </div>
  )
}

// Helper to build timeline streams for the whole-bible flow
function getWholeBibleTimelineStreams(config: WholeBibleConfig): any[] {
  const { newTestamentPlacement, wisdomBooksPlacement, includedWisdomBooks } = config

  // Get all OT and NT book codes
  const allOtBookCodes = getBookCodesByTestament("OT")
  const ntBookCodes = getBookCodesByTestament("NT")
  // Canonical wisdom book codes
  const canonicalWisdomBookCodes = getWisdomBookCodes()
  // User-selected wisdom book codes (by code)
  const selectedWisdomBookCodes = canonicalWisdomBookCodes.filter(code => {
    const book = getBookByCode(code)
    return book && includedWisdomBooks.includes(book.name)
  })
  // OT = all OT books minus selected wisdom books
  const otBookCodes =
    wisdomBooksPlacement === "alongside"
      ? allOtBookCodes.filter((code) => !selectedWisdomBookCodes.includes(code))
      : allOtBookCodes

  const otChapters = otBookCodes.reduce((sum, code) => sum + (getBookByCode(code)?.chapters || 0), 0)
  const ntChapters = ntBookCodes.reduce((sum, code) => sum + (getBookByCode(code)?.chapters || 0), 0)
  const wisdomChapters = selectedWisdomBookCodes.reduce((sum, code) => sum + (getBookByCode(code)?.chapters || 0), 0)

  if (newTestamentPlacement === "after") {
    // Single stream with segments for OT, NT, (Wisdom)
    const segments = []
    if (otChapters > 0) {
      segments.push({ type: "ot" as const, label: "Old Testament", size: otChapters })
    }
    if (ntChapters > 0) {
      segments.push({ type: "nt" as const, label: "New Testament", size: ntChapters })
    }
    if (wisdomBooksPlacement === "alongside" && wisdomChapters > 0) {
      segments.push({ type: "wisdom" as const, label: "Wisdom Books", size: wisdomChapters })
    }
    // Normalize sizes
    const total = segments.reduce((sum, seg) => sum + seg.size, 0)
    segments.forEach((seg) => (seg.size = seg.size / total))
    return [
      {
        type: "custom",
        label: "Whole Bible",
        segments,
        totalChapters: otChapters + ntChapters + wisdomChapters,
      },
    ]
  }

  // Alongside: separate streams for OT, Wisdom, NT
  const streams: any[] = []
  streams.push({
    type: "ot",
    label: "Old Testament",
    totalChapters: otChapters,
  })
  if (wisdomBooksPlacement === "alongside" && wisdomChapters > 0) {
    streams.push({
      type: "wisdom",
      label: "Wisdom Books",
      totalChapters: wisdomChapters,
    })
  }
  streams.push({
    type: "nt",
    label: "New Testament",
    totalChapters: ntChapters,
  })
  return streams
}
