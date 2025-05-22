"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { getBookByCode, getBookName, getDivisionName, getTestament, getBookCodesByDivision, getAllDivisions, getTotalChaptersInDivision } from "@/lib/book-utils"
import bookMetadata from "@/constants/bookMetadata.json" // Only for division grouping, not for book lookups
import ReadingPlanPreview from "./reading-plan-preview"
import TimelineVisualization from "./timeline-visualization"
import { generateMultiStreamPlan } from "@/lib/plan-generator"

interface BuildYourOwnFlowProps {
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

// Add a helper function to get stream color based on division
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

interface Stream {
  id: string
  name: string
  divisions: string[]
  chaptersPerDay: number
}

export default function BuildYourOwnFlow({ onComplete, onBack, duration }: BuildYourOwnFlowProps) {
  const [step, setStep] = useState(1)
  const [streamCount, setStreamCount] = useState(1)
  const [streams, setStreams] = useState<Stream[]>([
    {
      id: "stream-1",
      name: "Stream 1",
      divisions: [],
      chaptersPerDay: 1,
    },
  ])
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0)
  const [previewPlan, setPreviewPlan] = useState<any>(null)

  // Update streams when stream count changes
  useEffect(() => {
    // Create the specified number of streams, preserving existing ones
    const newStreams = Array.from({ length: streamCount }, (_, i) => {
      // If the stream already exists, keep it
      if (i < streams.length) {
        return streams[i]
      }
      // Otherwise create a new stream
      return {
        id: `stream-${i + 1}`,
        name: `Stream ${i + 1}`,
        divisions: [],
        chaptersPerDay: 1,
      }
    })
    setStreams(newStreams)

    // If current stream index is now out of bounds, adjust it
    if (currentStreamIndex >= streamCount) {
      setCurrentStreamIndex(Math.max(0, streamCount - 1))
    }
  }, [streamCount])

  // Get the current stream being configured
  const currentStream = streams[currentStreamIndex]

  // Handle stream count change
  const handleStreamCountChange = (newCount: number) => {
    // Ensure count is between 1 and 10
    const count = Math.max(1, Math.min(10, newCount))
    setStreamCount(count)
  }

  // Toggle a division in the current stream
  const toggleDivision = (division: string) => {
    const newStreams = [...streams]
    const stream = newStreams[currentStreamIndex]

    if (stream.divisions.includes(division)) {
      stream.divisions = stream.divisions.filter((d) => d !== division)
    } else {
      stream.divisions = [...stream.divisions, division]
    }

    setStreams(newStreams)
  }

  // Add multiple divisions to the current stream
  const addDivisions = (divisions: string[]) => {
    setStreams((prevStreams) => {
      const newStreams = [...prevStreams]
      const stream = { ...newStreams[currentStreamIndex] }

      // Filter out divisions that are already assigned to other streams
      const availableDivisions = divisions.filter((division) => {
        return !newStreams.some((otherStream, index) => {
          if (index === currentStreamIndex) return false // Skip the current stream
          return otherStream.divisions.includes(division)
        })
      })

      // Add all available divisions that aren't already in the stream
      stream.divisions = [...new Set([...stream.divisions, ...availableDivisions])]
      newStreams[currentStreamIndex] = stream

      return newStreams
    })
  }

  // Update chapters per day for the current stream
  const updateChaptersPerDay = (value: number) => {
    const newStreams = [...streams]
    newStreams[currentStreamIndex].chaptersPerDay = value
    setStreams(newStreams)
  }

  // Generate a preview plan
  const generatePreview = async () => {
    // Convert our streams to the format expected by generateMultiStreamPlan
    const planStreams = streams.map((stream) => {
      // Get all book codes from the selected divisions
      const bookCodes = stream.divisions.flatMap((division) => booksByDivision[division] || [])

      return {
        bookCodes,
        chaptersPerDay: stream.chaptersPerDay,
      }
    })

    // Only generate if we have books selected
    if (planStreams.some((stream) => stream.bookCodes.length > 0)) {
      const totalDays = duration.type === "months" ? duration.value * 30 : duration.value * 7

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
      presetId: "custom",
      presetName: "Custom Reading Plan",
      presetConfig: {
        streams: planStreams,
        totalPlanDays: duration.type === "months" ? duration.value * 30 : duration.value * 7,
      },
      totalPlanDays: duration.type === "months" ? duration.value * 30 : duration.value * 7,
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

    // Log for debugging
    console.log(`Stream ${stream.name} has ${totalChapters} chapters`)

    return {
      type: getStreamTypeForCurrentStream(stream.divisions),
      label: stream.name,
      segments,
      totalChapters, // Make sure this is passed correctly
    }
  }

  // Create visualization data for all streams
  const visualizationStreams = streams.map(createProportionalVisualization)

  // Create visualization for the current stream only
  const currentStreamVisualization = createProportionalVisualization(currentStream)

  // Step 1: Select streams
  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-center mb-2">How many reading streams do you want?</h1>
        <p className="text-center text-gray-400 text-base mb-6 max-w-xl">
          Each stream is a separate track of Bible readings. For example, you might want to read the Old and New Testaments in parallel, or have a dedicated stream for Psalms.
        </p>
        <div className="w-full max-w-md mx-auto mb-6">
          <Card className="p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-md">
            <TimelineVisualization
              streams={Array.from({ length: streamCount }, (_, i) => ({
                type: "custom",
                label: `Stream ${i + 1}`,
                repetitions: 1,
              }))}
              proportional={false}
            />
            <div className="flex flex-col items-center mt-4">
              <h2 className="text-lg font-medium mb-2">Number of Streams</h2>
              <div className="flex items-center bg-gray-800 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-xl"
                  onClick={() => handleStreamCountChange(streamCount - 1)}
                  disabled={streamCount <= 1}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <Input
                  type="number"
                  value={streamCount}
                  onChange={(e) => handleStreamCountChange(Number.parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="h-12 w-20 text-center bg-transparent border-0 text-2xl font-bold mx-2"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-xl"
                  onClick={() => handleStreamCountChange(streamCount + 1)}
                  disabled={streamCount >= 10}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-2">(1-10 streams)</p>
            </div>
          </Card>
        </div>
        <Button
          onClick={() => setStep(2)}
          className="bg-white text-black hover:bg-gray-200 w-full max-w-md py-3 text-lg font-semibold mb-4 mt-2"
          size="lg"
        >
          Next: Configure Streams
        </Button>
        <div className="w-full max-w-md mt-auto pt-4">
          <div className="w-full bg-gray-800 h-1 mb-4 rounded-full overflow-hidden">
            <div className="bg-white h-full" style={{ width: `${(1 / 3) * 100}%` }}></div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Configure each stream
  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-4">Configure Stream {currentStreamIndex + 1}</h1>

        {/* Timeline visualization for the current stream */}
        <div className="mb-6">
          <TimelineVisualization streams={[currentStreamVisualization]} />

          {/* Add this right after the TimelineVisualization component in step 2 */}
          {currentStreamVisualization.totalChapters > 0 && (
            <div className="text-center text-sm mt-1">Total chapters: {currentStreamVisualization.totalChapters}</div>
          )}

          {currentStream.divisions.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {currentStream.divisions.map((division) => (
                <div key={division} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-1 ${getStreamColor("custom", division)}`}></div>
                  <span>
                    {division} ({divisionChapterCounts[division] || 0})
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <div>
              Stream {currentStreamIndex + 1} of {streams.length}
            </div>
            <div>
              {currentStream.divisions.length > 0
                ? `${currentStream.divisions.length} division${currentStream.divisions.length !== 1 ? "s" : ""} selected`
                : "No divisions selected"}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Quick Add</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDivisions(allDivisions.filter((division) => division.startsWith("Old Testament")))}
              className="flex-1"
            >
              Old Testament
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addDivisions(allDivisions.filter((division) => division.startsWith("New Testament")))}
              className="flex-1"
            >
              New Testament
            </Button>
            <Button variant="outline" size="sm" onClick={() => addDivisions(allDivisions.filter((division) => division.startsWith("Poetry-Wisdom")))} className="flex-1">
              Wisdom Books
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Select Bible Divisions</h2>
          <div className="grid grid-cols-2 gap-3">
            {allDivisions.map((division) => {
              const books = booksByDivision[division] || []
              const isSelected = currentStream.divisions.includes(division)
              const chapterCount = divisionChapterCounts[division] || 0

              return (
                <Button
                  key={division}
                  variant="outline"
                  className={cn("h-auto py-3 px-3 justify-start", isSelected && "border-white bg-gray-800")}
                  onClick={() => toggleDivision(division)}
                >
                  <div className="flex items-start">
                    <div className="rounded-full w-5 h-5 border border-gray-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-2">
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{division}</div>
                      <div className="text-xs text-gray-400">
                        {books.length} books • {chapterCount} chapters
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Chapters Per Day</h2>
          <div className="flex space-x-2">
            {[1, 2, 3, 5, 10].map((value) => (
              <Button
                key={value}
                variant={currentStream.chaptersPerDay === value ? "default" : "outline"}
                className="flex-1"
                onClick={() => updateChaptersPerDay(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Selected Divisions</h2>
          {currentStream.divisions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentStream.divisions.map((division) => (
                <Badge key={division} variant="secondary">
                  {division} ({divisionChapterCounts[division] || 0} ch)
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-400 bg-gray-800 rounded-md">No divisions selected yet</div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="w-full bg-gray-800 h-1 mb-4 rounded-full overflow-hidden">
            <div className="bg-white h-full" style={{ width: `${(2 / 3) * 100}%` }}></div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>

            <div className="flex space-x-2">
              {currentStreamIndex < streams.length - 1 && (
                <Button variant="outline" onClick={() => setCurrentStreamIndex(currentStreamIndex + 1)}>
                  Next Stream
                </Button>
              )}

              {currentStreamIndex > 0 && (
                <Button variant="outline" onClick={() => setCurrentStreamIndex(currentStreamIndex - 1)}>
                  Previous Stream
                </Button>
              )}

              <Button
                onClick={() => {
                  generatePreview()
                  setStep(3)
                }}
                className="bg-white text-black hover:bg-gray-200"
              >
                Preview Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Preview and confirm
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-6">Your Custom Reading Plan</h1>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Plan Structure</h2>
        <TimelineVisualization streams={visualizationStreams} />

        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {allDivisions
            .filter((division: string) => streams.some((stream) => stream.divisions.includes(division)))
            .map((division: string) => (
              <span key={division} className="truncate">
                {division}
              </span>
            ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Stream Summary</h2>
        <div className="space-y-2">
          {streams.map((stream, index) => {
            const totalChapters = stream.divisions.reduce(
              (sum, division) => sum + (divisionChapterCounts[division] || 0),
              0,
            )

            return (
              <Card key={stream.id} className="p-3 bg-gray-900 border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{stream.name}</div>
                    <div className="text-sm text-gray-400">
                      {stream.chaptersPerDay} chapter{stream.chaptersPerDay !== 1 ? "s" : ""} per day
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div>
                      {stream.divisions.length} division{stream.divisions.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-gray-400">{totalChapters} chapters total</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {previewPlan && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Reading Preview</h2>
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
      )}

      <div className="mt-auto pt-4">
        <div className="w-full bg-gray-800 h-1 mb-4 rounded-full overflow-hidden">
          <div className="bg-white h-full" style={{ width: `100%` }}></div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button onClick={handleComplete} className="bg-white text-black hover:bg-gray-200">
            Create Plan
          </Button>
        </div>
      </div>
    </div>
  )
}
