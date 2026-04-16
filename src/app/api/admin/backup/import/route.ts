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
    const confirmPhrase = String(formData.get("confirmPhrase") ?? "")
    const backupFile = formData.get("backupFile")

    if (confirmPhrase.trim() !== "IMPORT ALL DATA") {
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
    const summary = await importDatabaseFromJson(parsed)

    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: "backup.imported",
      targetType: "system",
      targetId: "database",
      metadata: {
        fileName: backupFile.name,
        tableCount: summary.tableCount,
        insertedRows: summary.insertedRows,
      },
    })

    return NextResponse.json({
      ok: true,
      message: `Import complete. ${summary.insertedRows} rows loaded across ${summary.tableCount} tables.`,
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

