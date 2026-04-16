import { NextResponse } from "next/server"

import { exportDatabaseAsJson } from "@/src/lib/admin-backup"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveSession } from "@/src/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const activeSession = await getActiveSession()

  if (!activeSession || activeSession.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 })
  }

  try {
    const { payload, tableCount, rowCount } = await exportDatabaseAsJson()
    const fileDate = new Date().toISOString().replaceAll(":", "-")
    const fileName = `shelf-backup-${fileDate}.json`

    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: "backup.exported",
      targetType: "system",
      targetId: "database",
      metadata: {
        tableCount,
        rowCount,
      },
    })

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename=\"${fileName}\"`,
        "cache-control": "no-store",
      },
    })
  } catch (error) {
    console.error("Failed to export full backup:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to generate backup JSON." },
      { status: 500 }
    )
  }
}

