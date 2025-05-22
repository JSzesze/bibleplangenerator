"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Edit, Trash2, Info, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { getBookByCode, getBookName, getDivisionName, getTestament, getBookCodesByDivision, getAllDivisions, getTotalChaptersInDivision, getWisdomBookCodes } from "@/lib/book-utils"
import bookMetadata from "@/constants/bookMetadata.json" // Only for division grouping, not for book lookups
import ReadingPlanPreview from "./reading-plan-preview"
import TimelineVisualization from "./timeline-visualization"
import { generateMultiStreamPlan } from "@/lib/plan-generator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface StreamByStreamFlowProps {
  onComplete: (customConfig: any) => void
  onBack: () => void
  duration: {
    type: string
    value: number
  }
}

// Use dynamic division list
const allDivisions = getAllDivisions();

// Group bookCodes by division using book-utils
const booksByDivision: Record<string, number[]> = {};
allDivisions.forEach((division) => {
  booksByDivision[division] = getBookCodesByDivision(division);
});

// Calculate chapter counts for each division using book-utils
const divisionChapterCounts: Record<string, number> = {};
allDivisions.forEach((division) => {
  divisionChapterCounts[division] = getTotalChaptersInDivision(division);
});

// Define stream types for visualization
const getStreamTypeForDivision = (division: string): "ot" | "nt" | "wisdom" | "custom" => {
  if (division === "Poetry-Wisdom") return "wisdom"
  if (["Gospels", "Acts", "Pauline Epistles", "General Epistles", "Revelation"].includes(division)) return "nt"
  if (["Pentateuch", "Historical", "Major Prophets", "Minor Prophets"].includes(division)) return "ot"
  return "custom"
}

// Helper function to determine the primary type of the current stream
const getStreamTypeForCurrentStream = (divisions: string[]): "ot" | "nt" | "wisdom" | "custom" => {
  if (divisions.length === 0) return "custom"

  const typeCount = {
    ot: 0,
    nt: 0,
    wisdom: 0,
    custom: 0,
  }

  divisions.forEach((division) => {
    const type = getStreamTypeForDivision(division)
    typeCount[type]++
  })

  // Find the type with the highest count
  let maxCount = 0
  let primaryType: "ot" | "nt" | "wisdom" | "custom" = "custom"

  Object.entries(typeCount).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count
      primaryType = type as "ot" | "nt" | "wisdom" | "custom"
    }
  })

  return primaryType
}

// Get stream color based on division
const getStreamColor = (type: string, division?: string, customColor?: string): string => {
  if (customColor) return customColor

  // Division-based coloring
  if (division) {
    switch (division) {
      // Old Testament
      case "Pentateuch":
        return "bg-blue-700"
      case "Historical":
        return "bg-brown-600"
      case "Poetry-Wisdom":
        return "bg-olive-700"
      case "Major Prophets":
        return "bg-amber-700"
      case "Minor Prophets":
        return "bg-orange-700"
      // New Testament
      case "Gospels":
        return "bg-purple-800"
      case "Acts":
        return "bg-indigo-700"
      case "Pauline Epistles":
        return "bg-pink-700"
      case "General Epistles":
        return "bg-rose-700"
      case "Revelation":
        return "bg-red-700"
    }
  }

  // Fallback to type-based coloring
  switch (type) {
    case "ot":
      return "bg-brown-600"
    case "nt":
      return "bg-purple-800"
    case "wisdom":
      return "bg-olive-700"
    case "custom":
    default:
      return "bg-blue-600"
  }
}

function calculateStreamDuration(chapterCount: number, chaptersPerDay: number): number {
  return Math.ceil(chapterCount / chaptersPerDay)
}

// Add this function to format duration in a readable way
function formatDuration(days: number): string {
  if (days <= 30) {
    return `${days} days`
  } else if (days <= 365) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return remainingDays > 0
      ? `${months} month${months !== 1 ? "s" : ""} ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`
      : `${months} month${months !== 1 ? "s" : ""}`
  } else {
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    const months = Math.floor(remainingDays / 30)
    return months > 0
      ? `${years} year${years !== 1 ? "s" : ""} ${months} month${months !== 1 ? "s" : ""}`
      : `${years} year${years !== 1 ? "s" : ""}`
  }
}

interface Stream {
  id: string
  name: string
  divisions: string[]
  chaptersPerDay: number
}

// Helper: Returns a map of division name to repetition count across all streams
function getDivisionRepetitions(streams: Stream[]): Record<string, number> {
  const divisionCounts: Record<string, number> = {}
  streams.forEach((stream) => {
    stream.divisions.forEach((division) => {
      divisionCounts[division] = (divisionCounts[division] || 0) + 1
    })
  })
  return divisionCounts
}

// Helper: Returns a map of division name to repetition (decimal) from a plan's bookReadingCounts
function getDivisionRepetitionsFromPlan(plan: any): Record<string, number> {
  if (!plan || !plan.bookReadingCounts) return {}
  // Map bookCode to division
  const bookCodeToDivision: Record<number, string> = {}
  bookMetadata.forEach((book) => {
    bookCodeToDivision[book.bookCode] = book.division
  })
  // Sum readings and chapters per division
  const divisionReadings: Record<string, number> = {}
  const divisionChapters: Record<string, number> = {}
  Object.entries(plan.bookReadingCounts).forEach(([bookCodeStr, count]) => {
    const bookCode = Number(bookCodeStr)
    const division = bookCodeToDivision[bookCode]
    const book = getBookByCode(bookCode)
    if (!division || !book) return
    divisionReadings[division] = (divisionReadings[division] || 0) + (count as number)
    divisionChapters[division] = (divisionChapters[division] || 0) + book.chapters
  })
  // Calculate repetition
  const divisionRepetitions: Record<string, number> = {}
  Object.keys(divisionReadings).forEach((division) => {
    divisionRepetitions[division] = divisionChapters[division]
      ? divisionReadings[division] / divisionChapters[division]
      : 0
  })
  return divisionRepetitions
}

export default function StreamByStreamFlow({ onComplete, onBack, duration }: StreamByStreamFlowProps) {
  const [streams, setStreams] = useState<Stream[]>([])
  const [isEditingStream, setIsEditingStream] = useState(false)
  const [currentStream, setCurrentStream] = useState<Stream>({
    id: `stream-${Date.now()}`,
    name: `Stream ${streams.length + 1}`,
    divisions: [],
    chaptersPerDay: 1,
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [previewPlan, setPreviewPlan] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const [showStreamAlert, setShowStreamAlert] = useState<number | null>(null)

  const defaultDuration = { type: "days", value: 365 }
  const planDuration = duration.type === "months" ? duration.value * 30 : duration.value * 7
  const effectiveDuration = planDuration || defaultDuration.value

  const divisionRepetitions = previewPlan
    ? getDivisionRepetitionsFromPlan(previewPlan)
    : getDivisionRepetitions(streams)

  // Get all book codes that are already assigned to a stream
  const getAssignedBookCodes = () => {
    const assignedBooks = new Set<number>()

    streams.forEach((stream) => {
      stream.divisions.forEach((division) => {
        const bookCodes = booksByDivision[division] || []
        bookCodes.forEach((code) => {
          assignedBooks.add(code)
        })
      })
    })

    return assignedBooks
  }

  // Check if a division is already assigned to any stream
  const isDivisionAssigned = (division: string) => {
    // If we're editing an existing stream, don't consider its own divisions as assigned
    const relevantStreams = editingIndex !== null ? streams.filter((_, index) => index !== editingIndex) : streams

    return relevantStreams.some((stream) => stream.divisions.includes(division))
  }

  // Check if a division is partially assigned (some books are assigned to other streams)
  const isDivisionPartiallyAssigned = (division: string) => {
    const bookCodes = booksByDivision[division] || []
    if (bookCodes.length === 0) return false

    const assignedBooks = getAssignedBookCodes()

    // If we're editing an existing stream, don't consider its own books as assigned
    if (editingIndex !== null) {
      const currentStreamBooks = new Set<number>()
      streams[editingIndex].divisions.forEach((div) => {
        const divBookCodes = booksByDivision[div] || []
        divBookCodes.forEach((code) => {
          currentStreamBooks.add(code)
        })
      })

      // Check if any books in this division are assigned to other streams
      return bookCodes.some((code) => assignedBooks.has(code) && !currentStreamBooks.has(code))
    }

    // Check if any books in this division are already assigned
    return bookCodes.some((code) => assignedBooks.has(code))
  }

  // Toggle a division in the current stream
  const toggleDivision = (division: string) => {
    // If the division is already fully assigned to another stream, don't allow toggling
    if (isDivisionAssigned(division)) return

    setCurrentStream((prev) => {
      const newStream = { ...prev }

      if (newStream.divisions.includes(division)) {
        newStream.divisions = newStream.divisions.filter((d) => d !== division)
      } else {
        newStream.divisions = [...newStream.divisions, division]
      }

      return newStream
    })
  }

  // Add multiple divisions to the current stream
  const addDivisions = (divisions: string[]) => {
    setCurrentStream((prev) => {
      const newStream = { ...prev }

      // Filter out divisions that are already assigned to other streams
      const availableDivisions = divisions.filter((division) => !isDivisionAssigned(division))

      // Add all available divisions that aren't already in the stream
      newStream.divisions = [...new Set([...newStream.divisions, ...availableDivisions])]

      return newStream
    })
  }

  // Update chapters per day for the current stream
  const updateChaptersPerDay = (value: number) => {
    setCurrentStream((prev) => ({
      ...prev,
      chaptersPerDay: value,
    }))
  }

  // Start adding a new stream
  const handleAddStream = () => {
    setCurrentStream({
      id: `stream-${Date.now()}`,
      name: `Stream ${streams.length + 1}`,
      divisions: [],
      chaptersPerDay: 1,
    })
    setEditingIndex(null)
    setIsEditingStream(true)
  }

  // Edit an existing stream
  const handleEditStream = (index: number) => {
    setCurrentStream({ ...streams[index] })
    setEditingIndex(index)
    setIsEditingStream(true)
  }

  // Delete a stream
  const handleDeleteStream = (index: number) => {
    setStreams((prev) => prev.filter((_, i) => i !== index))
  }

  // Save the current stream
  const handleSaveStream = () => {
    if (editingIndex !== null) {
      // Update existing stream
      setStreams((prev) => {
        const newStreams = [...prev]
        newStreams[editingIndex] = { ...currentStream }
        return newStreams
      })
    } else {
      // Add new stream
      setStreams((prev) => [...prev, { ...currentStream }])
    }

    setIsEditingStream(false)
    generatePreview()
  }

  // Updated: Generate preview plan using the latest streams, including in-progress edits
  useEffect(() => {
    let previewStreams = streams
    if (isEditingStream && currentStream.divisions.length > 0) {
      if (editingIndex !== null) {
        previewStreams = [
          ...streams.slice(0, editingIndex),
          currentStream,
          ...streams.slice(editingIndex + 1),
        ]
      } else {
        previewStreams = [...streams, currentStream]
      }
    }
    generatePreview(previewStreams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, currentStream, isEditingStream, editingIndex])

  // Updated: Accept streams argument for preview
  const generatePreview = async (previewStreams = streams) => {
    // Only generate if we have streams with books
    if (previewStreams.length === 0) {
      setPreviewPlan(null)
      return
    }

    // Convert our streams to the format expected by generateMultiStreamPlan
    const planStreams = previewStreams.map((stream) => {
      // Get all book codes from the selected divisions
      const bookCodes = stream.divisions.flatMap((division) => booksByDivision[division] || [])

      return {
        bookCodes,
        chaptersPerDay: stream.chaptersPerDay,
      }
    })

    // Only generate if we have books selected
    if (planStreams.some((stream) => stream.bookCodes.length > 0)) {
      const totalDays = effectiveDuration

      try {
        const planData = await generateMultiStreamPlan({
          id: `custom-${Date.now()}`,
          name: "Custom Reading Plan",
          description: "Your personalized multi-stream reading plan",
          streams: planStreams,
          totalPlanDays: totalDays,
          tags: ["custom", "multi-stream"],
          author: "Bible Plan Generator",
          version: "1.0",
        })

        setPreviewPlan(planData)
      } catch (error) {
        console.error("Error generating plan preview:", error)
      }
    } else {
      setPreviewPlan(null)
    }
  }

  // Handle completion
  const handleComplete = () => {
    // Convert our streams to the format expected by the plan generator
    const planStreams = streams.map((stream) => {
      // Get all book codes from the selected divisions
      const bookCodes = stream.divisions.flatMap((division) => booksByDivision[division] || [])

      return {
        bookCodes,
        chaptersPerDay: stream.chaptersPerDay,
      }
    })

    onComplete({
      presetId: "custom-stream-by-stream",
      presetName: "Custom Stream-by-Stream Plan",
      presetConfig: {
        streams: planStreams,
        totalPlanDays: effectiveDuration,
      },
      totalPlanDays: effectiveDuration,
    })
  }

  // Create visualization data for the timeline with proportional segments
  const createProportionalVisualization = (stream: Stream) => {
    // If no divisions, return a simple stream
    if (stream.divisions.length === 0) {
      return {
        type: "custom" as const,
        label: stream.name,
        segments: [{ type: "custom" as const, size: 1 }],
        totalChapters: 0,
      }
    }

    // Calculate total chapters in this stream
    const totalChapters = stream.divisions.reduce((sum, division) => sum + (divisionChapterCounts[division] || 0), 0)

    // Create segments with proportional sizes
    const segments = stream.divisions.map((division) => {
      const chapterCount = divisionChapterCounts[division] || 0
      // Prevent division by zero which would result in NaN
      const size = totalChapters > 0 ? chapterCount / totalChapters : 1

      return {
        type: getStreamTypeForDivision(division),
        size,
        label: division, // Use division name as label
      }
    })

    // Sort segments by biblical order
    segments.sort((a, b) => {
      const indexA = allDivisions.indexOf(a.label || "")
      const indexB = allDivisions.indexOf(b.label || "")
      return indexA - indexB
    })

    return {
      type: getStreamTypeForCurrentStream(stream.divisions),
      label: stream.name,
      segments,
      totalChapters,
    }
  }

  // Create visualization data for all streams
  const visualizationStreams = streams.map(createProportionalVisualization)

  // Don't add a placeholder stream for visualization anymore
  const allVisualizationStreams = visualizationStreams

  // Add a placeholder stream for visualization
  // const allVisualizationStreams = [
  //   ...visualizationStreams,
  //   ...(isEditingStream ? [] : [{ type: "custom" as const, label: "Add a new stream", color: "bg-gray-700" }]),
  // ]

  // If we're in the stream editing mode
  if (isEditingStream) {
    // Create visualization for the current stream
    const currentStreamVisualization = createProportionalVisualization(currentStream)

    return (
      <div className="flex-1 flex flex-col">
        {/* Estimated Duration - very top, visually prominent */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-gray-800 rounded-md px-3 py-3 text-sm border-l-4"
               style={{ borderColor: calculateStreamDuration(currentStreamVisualization.totalChapters, currentStream.chaptersPerDay) > effectiveDuration ? '#f87171' : '#34d399' }}>
            <span>Total chapters: <span className="font-semibold">{currentStreamVisualization.totalChapters}</span></span>
            <span>Pace: <span className="font-semibold">{currentStream.chaptersPerDay}/day</span></span>
            <span className={cn(
              "font-semibold",
              calculateStreamDuration(currentStreamVisualization.totalChapters, currentStream.chaptersPerDay) > effectiveDuration
                ? "text-red-400"
                : "text-green-400",
            )}>
              {formatDuration(calculateStreamDuration(currentStreamVisualization.totalChapters, currentStream.chaptersPerDay))}
              {calculateStreamDuration(currentStreamVisualization.totalChapters, currentStream.chaptersPerDay) > effectiveDuration && " ⚠️"}
            </span>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="mb-4">
          <TimelineVisualization streams={[currentStreamVisualization]} />
        </div>

        {/* Stream Name Input and Chapters Per Day Incrementer (inline) */}
        <div className="mb-4 flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="stream-name" className="block text-sm font-medium mb-1">
              Stream Name
            </label>
            <Input
              id="stream-name"
              value={currentStream.name}
              onChange={(e) => setCurrentStream((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="block text-xs font-medium mb-1">Chapters/Day</label>
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => updateChaptersPerDay(Math.max(1, currentStream.chaptersPerDay - 1))}
                disabled={currentStream.chaptersPerDay <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                value={currentStream.chaptersPerDay}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(20, Number(e.target.value) || 1))
                  updateChaptersPerDay(val)
                }}
                min={1}
                max={20}
                className="h-8 w-12 text-center bg-transparent border-0 text-base font-bold mx-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => updateChaptersPerDay(Math.min(20, currentStream.chaptersPerDay + 1))}
                disabled={currentStream.chaptersPerDay >= 20}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Quick Add</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDivisions(allDivisions.filter((division) => {
                const bookCodes = booksByDivision[division] || [];
                return bookCodes.some((code) => getTestament(code) === "OT");
              }))}
              className="flex-1"
            >
              Old Testament
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDivisions(allDivisions.filter((division) => {
                const bookCodes = booksByDivision[division] || [];
                return bookCodes.some((code) => getTestament(code) === "NT");
              }))}
              className="flex-1"
            >
              New Testament
            </Button>
          </div>
        </div>

        {/* Division Selector */}
        <div className="mb-6 flex-1">
          <h2 className="text-lg font-medium mb-3">Select Bible Divisions</h2>
          <div className="grid grid-cols-2 gap-2">
            {allDivisions.map((division) => {
              const isSelected = currentStream.divisions.includes(division)
              const isAssigned = isDivisionAssigned(division)
              const isPartiallyAssigned = isDivisionPartiallyAssigned(division)
              return (
                <Button
                  key={division}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "py-2 px-2 text-xs flex items-center justify-between truncate",
                    isAssigned && "opacity-50 cursor-not-allowed",
                    isPartiallyAssigned && !isSelected && "border-yellow-500"
                  )}
                  onClick={() => toggleDivision(division)}
                  disabled={isAssigned}
                >
                  <span className="truncate">{division}</span>
                  <span className="flex items-center ml-1">
                    {isSelected && <Check className="h-3 w-3 ml-1" />}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="mt-auto pt-4 flex justify-between">
          <Button variant="ghost" onClick={() => setIsEditingStream(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveStream}
            className="bg-white text-black hover:bg-gray-200"
            disabled={currentStream.divisions.length === 0}
          >
            {editingIndex !== null ? "Update Stream" : "Add Stream"}
          </Button>
        </div>
      </div>
    )
  }

  // Main stream management screen
  return (
    <div className="flex-1 flex flex-col">
      {/* Heading and description */}
      <h1 className="text-2xl font-bold text-center mt-4 mb-2">Build Your Reading Plan</h1>
      <p className="text-center text-gray-400 text-base mb-6 max-w-xl mx-auto">
        Create multiple reading streams to read different parts of the Bible in parallel, or focus on specific sections.
      </p>

      {/* Holistic duration stat for all streams */}
      {streams.length > 0 && (
        (() => {
          // Calculate total chapters and estimated duration for all streams
          const totalChapters = streams.reduce(
            (sum, stream) => sum + stream.divisions.reduce((s, d) => s + (divisionChapterCounts[d] || 0), 0),
            0
          );
          // Calculate the max days needed for any stream (since streams run in parallel)
          const maxDays = Math.max(
            ...streams.map(stream => {
              const chapters = stream.divisions.reduce((s, d) => s + (divisionChapterCounts[d] || 0), 0);
              return stream.chaptersPerDay > 0 ? Math.ceil(chapters / stream.chaptersPerDay) : 0;
            }),
            0
          );
          const overDuration = maxDays > effectiveDuration;
          return (
            <div className="flex items-end justify-between mb-4 mt-2 gap-2 w-full max-w-2xl mx-auto">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] text-gray-400 mb-0.5">Streams</span>
                <span className="text-sm font-semibold text-gray-200">{streams.length}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] text-gray-400 mb-0.5">Total Chapters</span>
                <span className="text-sm font-semibold text-gray-200">{totalChapters}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] text-gray-400 mb-0.5">Plan Duration</span>
                <span className="text-sm font-semibold text-gray-200">{effectiveDuration} days</span>
              </div>
              {previewPlan && (
                <button
                  type="button"
                  aria-label="Show plan stats"
                  className="ml-2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition self-center"
                  onClick={() => setShowStats(true)}
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
              <Dialog open={showStats} onOpenChange={setShowStats}>
                <DialogContent className="max-w-2xl w-full">
                  <DialogHeader>
                    <DialogTitle>Plan Statistics</DialogTitle>
                    <DialogClose asChild>
                      <button aria-label="Close" className="absolute right-4 top-4 text-gray-400 hover:text-gray-200">×</button>
                    </DialogClose>
                  </DialogHeader>
                  <div className="mt-2">
                    <ReadingPlanPreview
                      config={{
                        readingType: "preset",
                        duration,
                        presetPlan: previewPlan,
                        wholeBibleConfig: {
                          newTestamentPlacement: "alongside",
                          wisdomBooksPlacement: "alongside",
                          includedWisdomBooks: [],
                        },
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })()
      )}

      {/* Timeline visualization for all streams (no card, just visual) */}
      <div className="mb-2">
        <TimelineVisualization streams={visualizationStreams} />
      </div>

      {/* List of streams */}
      {streams.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {streams.map((stream, index) => {
            const totalChapters = stream.divisions.reduce(
              (sum, division) => sum + (divisionChapterCounts[division] || 0),
              0,
            )
            const streamDuration = stream.chaptersPerDay > 0 ? calculateStreamDuration(totalChapters, stream.chaptersPerDay) : 0;
            const showAlert = streamDuration > effectiveDuration;

            return (
              <div
                key={stream.id}
                className="bg-gray-800 rounded-lg px-4 py-3 min-h-[56px] flex flex-col gap-1 cursor-pointer group transition hover:bg-gray-700"
                onClick={e => {
                  // Prevent edit if clicking the delete button or alert popover
                  if ((e.target as HTMLElement).closest('.delete-btn, .alert-popover-trigger')) return;
                  handleEditStream(index);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 gap-2">
                    <div className="font-semibold text-base truncate">{stream.name}</div>
                    {totalChapters > 0 && (
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full ml-1 font-normal border flex items-center",
                        streamDuration > effectiveDuration
                          ? "bg-red-900 text-red-300 border-red-900"
                          : "bg-green-900 text-green-300 border-green-900",
                      )}>
                        {formatDuration(streamDuration)}
                        {showAlert ? (
                          <Popover open={showStreamAlert === index} onOpenChange={open => setShowStreamAlert(open ? index : null)}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="alert-popover-trigger ml-1 text-red-300 hover:text-red-200 focus:outline-none"
                                tabIndex={0}
                                aria-label="Stream duration warning"
                                onClick={e => { e.stopPropagation(); setShowStreamAlert(index); }}
                              >
                                ⚠️
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs text-sm text-red-200 bg-red-900 border-red-700">
                              <div className="font-semibold mb-1">Stream Too Long</div>
                              <div>This stream will take longer than your plan duration. Increase the chapters per day count to fit within the plan.</div>
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-row gap-2 items-center ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="delete-btn p-1 text-red-500 opacity-70 hover:opacity-100 hover:text-red-700 transition"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteStream(index);
                      }}
                      aria-label="Delete stream"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-0.5">
                  <span>{stream.chaptersPerDay} chapter{stream.chaptersPerDay !== 1 ? "s" : ""}/day</span>
                  <span>• {stream.divisions.length} division{stream.divisions.length !== 1 ? "s" : ""}</span>
                  <span>• {totalChapters} chapters</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add stream button, visually distinct and separated */}
      <Button variant="outline" className="w-full max-w-md mx-auto mt-2 mb-8 border-dashed border-gray-700" onClick={handleAddStream}>
        <Plus className="h-4 w-4 mr-2" />
        Add a new stream
      </Button>

      <div className="mt-auto pt-4">
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-white text-black hover:bg-gray-200"
            disabled={streams.length === 0}
          >
            Create Plan
          </Button>
        </div>
      </div>
    </div>
  )
}
