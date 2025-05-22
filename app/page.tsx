"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import InitialSelection from "@/components/plan-wizard/initial-selection"
import SectionSelection from "@/components/plan-wizard/section-selection"
import PathwaySelection from "@/components/plan-wizard/pathway-selection"
import DurationSelection from "@/components/plan-wizard/duration-selection"
import PlanSummary from "@/components/plan-wizard/plan-summary"
import WholeBibleFlow, { type WholeBibleConfig } from "@/components/plan-wizard/whole-bible-flow"
import PresetPlanFlow from "@/components/plan-wizard/preset-plan-flow"
import BuildYourOwnFlow from "@/components/plan-wizard/build-your-own-flow"
import StreamByStreamFlow from "@/components/plan-wizard/stream-by-stream-flow"
import { BreadcrumbProvider, useBreadcrumb } from "@/components/plan-wizard/breadcrumb-context"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import React from "react"

function BreadcrumbsForStep({ step, planConfig }: { step: number, planConfig: any }) {
  const { items, setItems } = useBreadcrumb()
  React.useEffect(() => {
    // Compute breadcrumb path based on step and planConfig
    let crumbs = [
      { label: "Home", href: "/" },
      { label: "Plan Wizard" },
    ]
    if (step === 10) crumbs.push({ label: "Whole Bible" })
    else if (step === 15) crumbs.push({ label: "Preset Plan" })
    else if (step === 20) crumbs.push({ label: "Build Your Own" })
    else if (step === 25) crumbs.push({ label: "Stream-by-Stream" })
    setItems(crumbs)
  }, [step, planConfig, setItems])
  if (!items.length) return null
  return (
    <Breadcrumb className="mb-4 mt-2">
      <BreadcrumbList>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            <BreadcrumbItem>
              {i < items.length - 1 && item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {i < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function BiblePlanGenerator() {
  const [step, setStep] = useState(1)
  const [planConfig, setPlanConfig] = useState({
    readingType: "", // "whole", "section", "preset", "custom", or "stream-by-stream"
    section: "", // "old-testament", "new-testament", "psalms", "gospels", "custom"
    pathway: "", // "storyline", "straight", "hebrew"
    duration: {
      type: "months", // "months" or "weeks"
      value: 12,
    },
    selectedBooks: [] as number[],
    wholeBibleConfig: {
      newTestamentPlacement: "alongside",
      wisdomBooksPlacement: "alongside",
      includedWisdomBooks: ["Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Job"],
    } as WholeBibleConfig,
    presetConfig: null as any,
  })

  const updateConfig = (key: string, value: any) => {
    setPlanConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (planConfig.readingType === "whole") {
        // Skip to whole Bible flow
        setStep(10)
      } else if (planConfig.readingType === "preset") {
        // Skip to preset plan flow
        setStep(15)
      } else if (planConfig.readingType === "custom") {
        // Skip to build your own flow
        setStep(20)
      } else if (planConfig.readingType === "stream-by-stream") {
        // Skip to stream-by-stream flow
        setStep(25)
      } else {
        setStep((prev) => prev + 1)
      }
    } else {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (step === 10 || step === 15 || step === 20 || step === 25) {
      // Go back to initial selection
      setStep(1)
    } else if (
      step === 4 &&
      (planConfig.readingType === "whole" ||
        planConfig.readingType === "preset" ||
        planConfig.readingType === "custom" ||
        planConfig.readingType === "stream-by-stream")
    ) {
      // If we're at duration selection and came from a special flow, go back
      if (planConfig.readingType === "whole") {
        setStep(10)
      } else if (planConfig.readingType === "preset") {
        setStep(15)
      } else if (planConfig.readingType === "custom") {
        setStep(20)
      } else if (planConfig.readingType === "stream-by-stream") {
        setStep(25)
      }
    } else {
      setStep((prev) => Math.max(1, prev - 1))
    }
  }

  const handleCreatePlan = () => {
    // Here we would generate the plan and save it
    console.log("Creating plan with config:", planConfig)
    // For now, just show the summary
    setStep(5)
  }

  const handleWholeBibleFlowComplete = (wholeBibleConfig: WholeBibleConfig) => {
    updateConfig("wholeBibleConfig", wholeBibleConfig)
    setStep(4) // Go to duration selection
  }

  const handlePresetFlowComplete = (presetConfig: any) => {
    updateConfig("presetConfig", presetConfig)
    setStep(4) // Go to duration selection
  }

  const handleCustomFlowComplete = (customConfig: any) => {
    updateConfig("presetConfig", customConfig) // Reuse the presetConfig field
    setStep(4) // Go to duration selection
  }

  const handleStreamByStreamFlowComplete = (customConfig: any) => {
    updateConfig("presetConfig", customConfig) // Reuse the presetConfig field
    setStep(4) // Go to duration selection
  }

  return (
    <BreadcrumbProvider>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <header className="p-4"></header>
        <main className="flex-1 flex flex-col items-center justify-between p-4">
          <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
            <BreadcrumbsForStep step={step} planConfig={planConfig} />
            {step === 1 && (
              <InitialSelection
                value={planConfig.readingType}
                onChange={(value) => updateConfig("readingType", value)}
                showPresetOption={true}
                showCustomOption={true}
              />
            )}

            {step === 2 && (
              <SectionSelection
                value={planConfig.section}
                onChange={(value) => updateConfig("section", value)}
                onSelectBooks={(books) => updateConfig("selectedBooks", books)}
              />
            )}

            {step === 3 && (
              <PathwaySelection
                section={planConfig.section}
                value={planConfig.pathway}
                onChange={(value) => updateConfig("pathway", value)}
                selectedBooks={planConfig.selectedBooks}
              />
            )}

            {step === 4 && (
              <DurationSelection
                duration={planConfig.duration}
                onChange={(duration) => updateConfig("duration", duration)}
                section={planConfig.section}
                pathway={planConfig.pathway}
                readingType={planConfig.readingType}
                presetName={planConfig.presetConfig?.presetName}
                selectedBooks={planConfig.selectedBooks}
              />
            )}

            {step === 5 && <PlanSummary config={planConfig} />}

            {step === 10 && (
              <WholeBibleFlow
                onComplete={handleWholeBibleFlowComplete}
                onBack={handleBack}
                duration={planConfig.duration}
              />
            )}

            {step === 15 && (
              <PresetPlanFlow onComplete={handlePresetFlowComplete} onBack={handleBack} duration={planConfig.duration} />
            )}

            {step === 20 && (
              <BuildYourOwnFlow
                onComplete={handleCustomFlowComplete}
                onBack={handleBack}
                duration={planConfig.duration}
              />
            )}

            {step === 25 && (
              <StreamByStreamFlow
                onComplete={handleStreamByStreamFlowComplete}
                onBack={handleBack}
                duration={planConfig.duration}
              />
            )}

            {step !== 10 && step !== 15 && step !== 20 && step !== 25 && (
              <div className="mt-auto pt-4">
                <div className="w-full bg-gray-800 h-1 mb-4 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full"
                    style={{
                      width: `${(step / (step === 5 ? 5 : 4)) * 100}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between">
                  {step > 1 ? (
                    <Button variant="ghost" onClick={handleBack}>
                      Back
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {step < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={
                        (step === 1 && !planConfig.readingType) ||
                        (step === 2 && !planConfig.section) ||
                        (step === 3 && !planConfig.pathway)
                      }
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      Next
                    </Button>
                  ) : step === 4 ? (
                    <Button onClick={handleCreatePlan} className="bg-white text-black hover:bg-gray-200">
                      Create
                    </Button>
                  ) : (
                    <Button onClick={() => setStep(1)} className="bg-white text-black hover:bg-gray-200">
                      Create Another
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </BreadcrumbProvider>
  )
}
