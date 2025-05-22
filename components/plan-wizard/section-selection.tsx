"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import bibleBooks from "@/constants/books.json"

interface SectionSelectionProps {
  value: string
  onChange: (value: string) => void
  onSelectBooks: (books: number[]) => void
}

export default function SectionSelection({ value, onChange, onSelectBooks }: SectionSelectionProps) {
  const [showBookSelector, setShowBookSelector] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<number[]>([])

  const handleSelectSection = (section: string) => {
    onChange(section)

    // Pre-select books based on section
    if (section === "old-testament") {
      onSelectBooks(Array.from({ length: 39 }, (_, i) => i + 1))
    } else if (section === "new-testament") {
      onSelectBooks(Array.from({ length: 27 }, (_, i) => i + 40))
    } else if (section === "psalms") {
      onSelectBooks([19])
    } else if (section === "gospels") {
      onSelectBooks([40, 41, 42, 43])
    }
  }

  const handleCustomSelection = () => {
    onChange("custom")
    setShowBookSelector(true)
  }

  const handleToggleBook = (bookCode: number) => {
    const newSelection = selectedBooks.includes(bookCode)
      ? selectedBooks.filter((code) => code !== bookCode)
      : [...selectedBooks, bookCode]

    setSelectedBooks(newSelection)
    onSelectBooks(newSelection)
  }

  const handleSaveBookSelection = () => {
    setShowBookSelector(false)
  }

  if (showBookSelector) {
    const oldTestamentBooks = bibleBooks.filter((book: any) => book.testament === "OT")
    const newTestamentBooks = bibleBooks.filter((book: any) => book.testament === "NT")

    return (
      <div className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-6">Select books to include</h1>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Old Testament</h2>
              <div className="grid grid-cols-2 gap-2">
                {oldTestamentBooks.map((book: any) => (
                  <div key={book.bookCode} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`book-${book.bookCode}`}
                      checked={selectedBooks.includes(book.bookCode)}
                      onChange={() => handleToggleBook(book.bookCode)}
                      className="rounded-sm"
                    />
                    <label htmlFor={`book-${book.bookCode}`} className="text-sm">
                      {book.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">New Testament</h2>
              <div className="grid grid-cols-2 gap-2">
                {newTestamentBooks.map((book: any) => (
                  <div key={book.bookCode} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`book-${book.bookCode}`}
                      checked={selectedBooks.includes(book.bookCode)}
                      onChange={() => handleToggleBook(book.bookCode)}
                      className="rounded-sm"
                    />
                    <label htmlFor={`book-${book.bookCode}`} className="text-sm">
                      {book.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <Button onClick={handleSaveBookSelection} className="mt-4 bg-white text-black hover:bg-gray-200">
          Save Selection
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">
        Which section would
        <br />
        you like to read?
      </h1>

      <div className="space-y-4">
        <SectionButton
          label="Old Testament"
          isSelected={value === "old-testament"}
          onClick={() => handleSelectSection("old-testament")}
        />

        <SectionButton
          label="New Testament"
          isSelected={value === "new-testament"}
          onClick={() => handleSelectSection("new-testament")}
        />

        <SectionButton label="Psalms" isSelected={value === "psalms"} onClick={() => handleSelectSection("psalms")} />

        <SectionButton
          label="The Gospels"
          isSelected={value === "gospels"}
          onClick={() => handleSelectSection("gospels")}
        />

        <Button
          variant="outline"
          className="w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800"
          onClick={handleCustomSelection}
        >
          <span>Custom section</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

interface SectionButtonProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

function SectionButton({ label, isSelected, onClick }: SectionButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full h-auto py-6 px-4 flex items-center justify-between text-xl border-gray-700 hover:bg-gray-800",
        isSelected && "border-white bg-gray-800",
      )}
      onClick={onClick}
    >
      <span>{label}</span>
      <div className="rounded-full w-6 h-6 border border-gray-500 flex items-center justify-center">
        {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
      </div>
    </Button>
  )
}
