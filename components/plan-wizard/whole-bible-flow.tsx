"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReadingPlanPreview from "./reading-plan-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TimelineVisualization from "./timeline-visualization"
import { getBookCodesByTestament, getBookCodesByDivision, getBookByCode, getWisdomBookCodes } from "@/lib/book-utils"
import DurationSelection from "./duration-selection"
import bibleBooks from "@/constants/books.json"
import { useBreadcrumb } from "./breadcrumb-context"

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

export default function WholeBibleFlow({ onComplete, onBack, duration: initialDuration }: WholeBibleFlowProps) {
  const [step, setStep] = useState(1)
  const [duration, setDuration] = useState(initialDuration)
  const [config, setConfig] = useState<WholeBibleConfig>({
    newTestamentPlacement: "alongside",
    wisdomBooksPlacement: "alongside",
    includedWisdomBooks: ["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Job"],
  })
  const [showWisdomSelector, setShowWisdomSelector] = useState(false)
  const { setItems } = useBreadcrumb()

  // Update breadcrumbs based on current step
  useEffect(() => {
    const stepLabels = {
      1: "Duration",
      2: "New Testament",
      3: "Wisdom Books"
    }
    
    setItems([
      { label: "Home", href: "/" },
      { label: "Plan Wizard" },
      { label: "Whole Bible" },
      { label: stepLabels[step as keyof typeof stepLabels] || "Configuration" }
    ])
  }, [step, setItems])

  const handleNext = () => {
    if (step < 3) {
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

  const handleCreate = () => {
    onComplete(config)
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
          <DurationSelection
            duration={duration}
            onChange={setDuration}
            section="whole-bible"
            pathway=""
            readingType="whole"
            selectedBooks={[]}
          />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            How do you want to read
            <br />
            the New Testament?
          </h1>

          <TimelineVisualization
            streams={getWholeBibleTimelineStreams(config)}
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

      {step === 3 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            How do you want to read
            <br />
            the wisdom books?
          </h1>

          <TimelineVisualization
            streams={getWholeBibleTimelineStreams(config)}
          />

          <div className="space-y-4 mt-10">
            <ReadingOptionButton
              label="Alongside the Old Testament"
              description="Read wisdom books as a separate stream"
              isSelected={config.wisdomBooksPlacement === "alongside"}
              onClick={() => {
                updateConfig("wisdomBooksPlacement", "alongside")
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
          <div className="bg-white h-full" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext} className="bg-white text-black hover:bg-gray-200" disabled={step === 3 && showWisdomWarning}>
            {step === 3 ? "Finish" : "Next"}
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

// Helper to build streams for the whole-bible flow at the book level
function getWholeBibleStreams(config: WholeBibleConfig) {
  const { newTestamentPlacement, wisdomBooksPlacement, includedWisdomBooks } = config

  // Get all OT and NT book codes
  const allOtBookCodes = bibleBooks.filter((b: any) => b.testament === "OT").map((b: any) => b.bookCode)
  const ntBookCodes = bibleBooks.filter((b: any) => b.testament === "NT").map((b: any) => b.bookCode)
  // Canonical wisdom book codes
  const canonicalWisdomBookCodes = [18, 19, 20, 21, 22] // Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon
  // User-selected wisdom book codes (by code)
  const selectedWisdomBookCodes = canonicalWisdomBookCodes.filter(code => {
    const book = bibleBooks.find((b: any) => b.bookCode === code)
    return book && includedWisdomBooks.includes(book.name)
  })

  if (newTestamentPlacement === "after") {
    // Single stream: OT (with or without wisdom), then NT
    let otBooks: number[]
    if (wisdomBooksPlacement === "alongside") {
      // Wisdom books are skipped in OT order
      otBooks = allOtBookCodes.filter(code => !selectedWisdomBookCodes.includes(code))
    } else {
      // Wisdom books are included in canonical order
      otBooks = allOtBookCodes
    }
    // One stream: OT (possibly minus wisdom), then wisdom (if within), then NT
    let streamBooks = [...otBooks]
    if (wisdomBooksPlacement === "alongside") {
      // Wisdom books will be a segment, not a separate stream
      streamBooks = [...otBooks, ...selectedWisdomBookCodes]
    }
    streamBooks = [...streamBooks, ...ntBookCodes]
    return [
      { bookCodes: streamBooks }
    ]
  } else {
    // 'alongside' NT: separate streams for OT, Wisdom, NT
    let otBooks = allOtBookCodes
    if (wisdomBooksPlacement === "alongside") {
      otBooks = allOtBookCodes.filter(code => !selectedWisdomBookCodes.includes(code))
    }
    const streams = [
      { bookCodes: otBooks },
    ]
    if (wisdomBooksPlacement === "alongside" && selectedWisdomBookCodes.length > 0) {
      streams.push({ bookCodes: selectedWisdomBookCodes })
    }
    streams.push({ bookCodes: ntBookCodes })
    return streams
  }
}

// Helper to build timeline visualization streams from book-level streams
function getWholeBibleTimelineStreams(config: WholeBibleConfig) {
  const { newTestamentPlacement, wisdomBooksPlacement, includedWisdomBooks } = config;
  
  // Calculate chapter counts for each section
  const allOtBookCodes = bibleBooks.filter((b: any) => b.testament === "OT").map((b: any) => b.bookCode);
  const ntBookCodes = bibleBooks.filter((b: any) => b.testament === "NT").map((b: any) => b.bookCode);
  const canonicalWisdomBookCodes = [18, 19, 20, 21, 22]; // Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon
  const selectedWisdomBookCodes = canonicalWisdomBookCodes.filter(code => {
    const book = bibleBooks.find((b: any) => b.bookCode === code);
    return book && includedWisdomBooks.includes(book.name);
  });
  
  const otWithoutWisdomCodes = allOtBookCodes.filter(code => !canonicalWisdomBookCodes.includes(code));
  
  // Calculate chapter counts
  const otWithWisdomChapters = allOtBookCodes.reduce((sum, code) => {
    const book = bibleBooks.find((b: any) => b.bookCode === code);
    return sum + (book ? book.chapters : 0);
  }, 0);
  
  const otWithoutWisdomChapters = otWithoutWisdomCodes.reduce((sum, code) => {
    const book = bibleBooks.find((b: any) => b.bookCode === code);
    return sum + (book ? book.chapters : 0);
  }, 0);
  
  const wisdomChapters = selectedWisdomBookCodes.reduce((sum, code) => {
    const book = bibleBooks.find((b: any) => b.bookCode === code);
    return sum + (book ? book.chapters : 0);
  }, 0);
  
  const ntChapters = ntBookCodes.reduce((sum, code) => {
    const book = bibleBooks.find((b: any) => b.bookCode === code);
    return sum + (book ? book.chapters : 0);
  }, 0);
  
  // Hard-code the four specific cases
  if (newTestamentPlacement === "after" && wisdomBooksPlacement === "within") {
    // Case 1: Single stream with OT (including wisdom) then NT
    return [{
      type: "custom" as const,
      label: "",
      segments: [
        { type: "ot" as const, label: "OT", size: otWithWisdomChapters },
        { type: "nt" as const, label: "NT", size: ntChapters }
      ]
    }];
  }
  
  if (newTestamentPlacement === "after" && wisdomBooksPlacement === "alongside") {
    // Case 2: Two streams - Main (OT without wisdom + NT), Wisdom separate
    const streams = [];
    
    // Main stream with OT (no wisdom) + NT segments
    streams.push({
      type: "custom" as const,
      label: "",
      segments: [
        { type: "ot" as const, label: "OT", size: otWithoutWisdomChapters },
        { type: "nt" as const, label: "NT", size: ntChapters }
      ]
    });
    
    // Wisdom stream (if any wisdom books selected)
    if (selectedWisdomBookCodes.length > 0) {
      streams.push({
        type: "wisdom" as const,
        label: "Wisdom Books"
      });
    }
    
    return streams;
  }
  
  if (newTestamentPlacement === "alongside" && wisdomBooksPlacement === "within") {
    // Case 3: Two streams - OT (with wisdom), NT separate
    return [
      {
        type: "ot" as const,
        label: "Old Testament"
      },
      {
        type: "nt" as const,
        label: "New Testament"
      }
    ];
  }
  
  if (newTestamentPlacement === "alongside" && wisdomBooksPlacement === "alongside") {
    // Case 4: Three streams - OT (no wisdom), Wisdom, NT
    const streams = [];
    
    streams.push({
      type: "ot" as const,
      label: "Old Testament"
    });
    
    if (selectedWisdomBookCodes.length > 0) {
      streams.push({
        type: "wisdom" as const,
        label: "Wisdom Books"
      });
    }
    
    streams.push({
      type: "nt" as const,
      label: "New Testament"
    });
    
    return streams;
  }
  
  // Fallback (shouldn't happen)
  return [{
    type: "custom" as const,
    label: "Bible Reading"
  }];
}
