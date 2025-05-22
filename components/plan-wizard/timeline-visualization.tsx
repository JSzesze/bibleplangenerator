"use client"

export interface TimelineSegment {
  type: "ot" | "nt" | "wisdom" | "custom"
  label?: string
  size: number // Relative size based on chapter count
  color?: string
}

export interface TimelineStream {
  type: "ot" | "nt" | "wisdom" | "custom"
  label: string
  segments?: TimelineSegment[] // For proportional visualization
  repetitions?: number // Fallback for simple visualization
  color?: string
  totalChapters?: number
}

export interface TimelineVisualizationProps {
  streams: TimelineStream[]
  layout?: "vertical" | "horizontal"
  showLabels?: boolean
  proportional?: boolean // Whether to show proportional segments
}

export default function TimelineVisualization({
  streams,
  layout = "vertical",
  showLabels = true,
  proportional = true,
}: TimelineVisualizationProps) {
  // Get color based on stream type
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

  return (
    <div className="relative my-8 px-4">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-gray-700"></div>
      <div className="absolute inset-y-0 right-0 w-0.5 bg-gray-700"></div>

      <div className="flex flex-col space-y-4">
        {streams.map((stream, index) => {
          // Check if we have detailed segment data for proportional display
          const hasSegments = proportional && stream.segments && stream.segments.length > 0

          return (
            <div key={index} className="h-16 rounded-md relative overflow-hidden">
              {/* For proportional visualization with segments */}
              {hasSegments ? (
                <div className="absolute inset-0 flex space-x-1">
                  {stream.segments!.map((segment, i) => (
                    <div
                      key={i}
                      className={
                        `${getStreamColor(segment.type, stream.label, segment.color)} rounded-md` +
                        (segment.size < 1 ? " opacity-60" : "")
                      }
                      style={{
                        flexGrow: isNaN(segment.size) ? 1 : segment.size, // Prevent NaN values
                        flexBasis: 0,
                        flexShrink: 0,
                        minWidth: segment.size < 0.2 ? "12px" : undefined,
                      }}
                    ></div>
                  ))}
                </div>
              ) : (
                // Fallback for non-segment plans
                <div
                  className={`absolute inset-0 ${getStreamColor(stream.type, undefined, stream.color)} rounded-md`}
                ></div>
              )}

              {/* Stream label */}
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-sm font-medium z-10">{stream.label}</span>

                {/* Show repetitions badge for Horner-style plans */}
                {typeof stream.repetitions === "number" && stream.repetitions > 1 ? (
                  <span className="text-xs ml-2 bg-black bg-opacity-50 px-1.5 py-0.5 rounded-full">
                    x{stream.repetitions}
                  </span>
                ) : stream.totalChapters ? (
                  <span className="text-xs ml-2 bg-black bg-opacity-50 px-1.5 py-0.5 rounded-full">
                    {stream.totalChapters} chapters
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {showLabels && (
        <>
          <div className="absolute -bottom-6 left-0 text-sm text-gray-400">Start</div>
          <div className="absolute -bottom-6 right-0 text-sm text-gray-400">End</div>
        </>
      )}
    </div>
  )
}
