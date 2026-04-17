import { NextResponse } from "next/server"

import { importDatabaseFromJson } from "@/src/lib/admin-backup"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveSession } from "@/src/lib/session"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const activeSession = await getActiveSession()

  if (!activeSession || activeSession.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const modeRaw = String(formData.get("mode") ?? "apply")
    const mode = modeRaw === "dry-run" ? "dry-run" : "apply"
    const confirmPhrase = String(formData.get("confirmPhrase") ?? "")
    const backupFile = formData.get("backupFile")

    if (mode === "apply" && confirmPhrase.trim() !== "IMPORT ALL DATA") {
      return NextResponse.json(
        {
          ok: false,
          message: 'Confirmation phrase mismatch. Type "IMPORT ALL DATA" to continue.',
        },
        { status: 400 }
      )
    }

    if (!(backupFile instanceof File)) {
      return NextResponse.json({ ok: false, message: "Backup file is required." }, { status: 400 })
    }

    const backupText = await backupFile.text()
    const parsed = JSON.parse(backupText) as unknown
    const summary = await importDatabaseFromJson(parsed, { mode })

    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: mode === "dry-run" ? "backup.import_dry_run" : "backup.imported",
      targetType: "system",
      targetId: "database",
      metadata: {
        mode,
        fileName: backupFile.name,
        tableCount: summary.tableCount,
        plannedRows: summary.plannedRows,
        insertedRows: summary.insertedRows,
      },
    })

    return NextResponse.json({
      ok: true,
      message:
        mode === "dry-run"
          ? `Dry-run complete. ${summary.plannedRows} rows would be loaded across ${summary.tableCount} tables.`
          : `Import complete. ${summary.insertedRows} rows loaded across ${summary.tableCount} tables.`,
      summary,
    })
  } catch (error) {
    console.error("Failed to import full backup:", error)
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to import backup JSON.",
      },
      { status: 500 }
    )
  }
}

