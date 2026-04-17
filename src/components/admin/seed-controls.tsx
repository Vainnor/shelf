"use client"

import { Loader2, Play, FlaskConical, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

type SeedMode = "dry-run" | "apply" | "cleanup"

type SeedResult = {
  ok: boolean
  message?: string
  summary?: Record<string, unknown>
  deleted?: Array<{ table: string; rows: number }>
}

export default function SeedControls() {
  const [mode, setMode] = useState<SeedMode>("dry-run")
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<SeedResult | null>(null)

  const expectedPhrase =
    mode === "apply" ? "SEED DEMO DATA" : mode === "cleanup" ? "CLEANUP SEED DATA" : ""

  async function runSeedAction(nextMode: SeedMode) {
    setRunning(true)
    setMode(nextMode)

    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: nextMode,
          confirmPhrase,
        }),
      })

      const result = (await response.json()) as SeedResult
      setLastResult(result)

      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "Seed action failed")
        return
      }

      toast.success(result.message ?? "Seed action completed")
      if (nextMode !== "dry-run") {
        setConfirmPhrase("")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Seed action failed")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use dry-run to preview generated demo counts. Apply and cleanup require explicit confirmation.
      </p>

      <Input
        value={confirmPhrase}
        onChange={(event) => setConfirmPhrase(event.target.value)}
        placeholder={expectedPhrase || "SEED DEMO DATA or CLEANUP SEED DATA"}
        disabled={running}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void runSeedAction("dry-run")}
          disabled={running}
          className="gap-2"
        >
          {running && mode === "dry-run" ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
          Dry-run
        </Button>
        <Button
          type="button"
          onClick={() => void runSeedAction("apply")}
          disabled={running || confirmPhrase.trim() !== "SEED DEMO DATA"}
          className="gap-2"
        >
          {running && mode === "apply" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          Apply seed
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void runSeedAction("cleanup")}
          disabled={running || confirmPhrase.trim() !== "CLEANUP SEED DATA"}
          className="gap-2"
        >
          {running && mode === "cleanup" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Cleanup seed rows
        </Button>
      </div>

      {lastResult ? (
        <pre className="overflow-x-auto rounded bg-muted/40 p-3 text-[11px] leading-relaxed">
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}


