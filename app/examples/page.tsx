"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { PrecalculatedDailyPlanSchema } from "@/lib/plan-generator"
import { Badge } from "@/components/ui/badge"
import { generateExamplePlans } from "@/lib/example-plans"
import { books } from "@/lib/books"

export default function ExamplePlans() {
  const [plans, setPlans] = useState<PrecalculatedDailyPlanSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    async function loadExamplePlans() {
      try {
        const examplePlans = await generateExamplePlans()
        setPlans(examplePlans)
        if (examplePlans.length > 0) {
          setSelectedPlan(examplePlans[0].id)
        }
      } catch (error) {
        console.error("Error loading example plans:", error)
      } finally {
        setLoading(false)
      }
    }

    loadExamplePlans()
  }, [])

  const handleDownloadPlan = (plan: PrecalculatedDailyPlanSchema) => {
    // Create a copy of the plan to modify for export
    const exportPlan = { ...plan }

    // First, stringify the entire plan with pretty formatting
    const jsonString = JSON.stringify(exportPlan, null, 2)

    // Find the dailyReadings section and replace it with a compact version
    const dailyReadingsRegex = /"dailyReadings": \[\s+\[[\s\S]*?\]\s+\]/g

    // Create a compact version of the dailyReadings array
    const compactDailyReadings = JSON.stringify(exportPlan.dailyReadings)
      // Remove all whitespace between elements
      .replace(/\s+/g, "")

    // Replace the dailyReadings section with the compact version
    const compactJson = jsonString.replace(dailyReadingsRegex, `"dailyReadings": ${compactDailyReadings}`)

    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(compactJson)
    const exportFileDefaultName = `${plan.name.toLowerCase().replace(/\s+/g, "-")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const currentPlan = plans.find((p) => p.id === selectedPlan)

  const getBookName = (bookCode: number) => {
    const book = books.find((b: any) => b.bookCode === bookCode)
    return book ? book.name : `Book ${bookCode}`
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-2">Example Bible Reading Plans</h1>
      <p className="text-center text-muted-foreground mb-8">Browse and download pre-configured Bible reading plans</p>

      {loading ? (
        <div className="text-center py-10">
          <p>Loading example plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Select a plan to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <Button
                      key={plan.id}
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {plan.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            {currentPlan ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{currentPlan.name}</CardTitle>
                      <CardDescription>{currentPlan.description}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPlan(currentPlan)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentPlan.tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline">{currentPlan.totalPlanDays} days</Badge>
                    </div>

                    <ScrollArea className="h-[500px] pr-4">
                      <Accordion type="multiple" className="w-full">
                        {currentPlan.dailyReadings.slice(0, 10).map((day, dayIndex) => (
                          <AccordionItem key={dayIndex} value={`day-${dayIndex}`}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-primary" />
                                <span>Day {dayIndex + 1}</span>
                                <Badge variant="outline" className="ml-2">
                                  {day.length} reading{day.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-2 border rounded-md">
                                <div className="text-sm">
                                  {day.map((reading, readingIndex) => (
                                    <span key={readingIndex}>
                                      {readingIndex > 0 && " • "}
                                      <span className="font-medium">
                                        {reading.bookName || getBookName(reading.bookCode)}
                                      </span>
                                      <span className="text-muted-foreground"> {reading.chapter}</span>
                                      {reading.verses && (
                                        <span className="text-muted-foreground">:{reading.verses}</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                        {currentPlan.dailyReadings.length > 10 && (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>Showing first 10 days of {currentPlan.totalPlanDays} total days</p>
                          </div>
                        )}
                      </Accordion>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Select a plan from the list to view its details.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
