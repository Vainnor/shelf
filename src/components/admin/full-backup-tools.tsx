"use client"

import { Loader2, Upload } from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { cn } from "@/src/lib/utils"

export default function FullBackupTools() {
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [mode, setMode] = useState<"dry-run" | "apply">("dry-run")
  const [isImporting, setIsImporting] = useState(false)

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!backupFile) {
      toast.error("Choose a backup JSON file first.")
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.set("backupFile", backupFile)
      formData.set("confirmPhrase", confirmPhrase)
      formData.set("mode", mode)

      const response = await fetch("/api/admin/backup/import", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok || !result.ok) {
        toast.error(result.message || "Import failed")
        return
      }

      toast.success(result.message || "Backup imported successfully.")
      if (mode === "apply") {
        setConfirmPhrase("")
      }
      setBackupFile(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import backup file.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/backup/export"
          download
          className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
        >
          Download full backup JSON
        </a>
      </div>

      <form onSubmit={handleImport} className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium">Import backup JSON (destructive)</p>
        <p className="text-xs text-muted-foreground">
          This replaces the entire database content on this instance, including users and auth data.
        </p>

        <label className="grid gap-1 text-sm">
          <span>Backup file</span>
          <Input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null
              setBackupFile(nextFile)
            }}
            disabled={isImporting}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Import mode</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value === "apply" ? "apply" : "dry-run")}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            disabled={isImporting}
          >
            <option value="dry-run">Dry-run (preview only)</option>
            <option value="apply">Apply (replace all data)</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span>Type confirmation phrase</span>
          <Input
            value={confirmPhrase}
            onChange={(event) => setConfirmPhrase(event.target.value)}
            placeholder="IMPORT ALL DATA"
            disabled={isImporting || mode !== "apply"}
          />
        </label>

        <Button
          type="submit"
          variant={mode === "apply" ? "destructive" : "default"}
          className="gap-2"
          disabled={isImporting || !backupFile || (mode === "apply" && confirmPhrase.trim() !== "IMPORT ALL DATA")}
        >
          {isImporting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing backup...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              {mode === "apply" ? "Import and replace database" : "Run dry-run preview"}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
