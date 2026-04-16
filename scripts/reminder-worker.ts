import { runReminderDispatchCycle } from "../src/lib/reminders"

function parseArg(name: string) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`))
  if (!arg) {
    return null
  }
  const [, value] = arg.split("=")
  return value ?? null
}

async function runCycle() {
  const maxUsers = Number(parseArg("--max-users") ?? process.env.REMINDER_WORKER_MAX_USERS ?? "100")
  const startedAt = new Date()

  const summary = await runReminderDispatchCycle(Number.isFinite(maxUsers) ? maxUsers : 100)
  const elapsedMs = Date.now() - startedAt.getTime()

  console.log(
    `[reminder-worker] cycle completed in ${elapsedMs}ms: checked=${summary.checkedUsers} skipped=${summary.skippedUsers} queued=${summary.queuedEmails}`
  )
}

async function main() {
  const once = process.argv.includes("--once")
  const intervalMs = Number(
    parseArg("--interval-ms") ?? process.env.REMINDER_WORKER_INTERVAL_MS ?? String(15 * 60 * 1000)
  )

  if (once) {
    await runCycle()
    return
  }

  await runCycle()

  const safeInterval = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 15 * 60 * 1000
  console.log(`[reminder-worker] running in loop every ${safeInterval}ms`)

  const timer = setInterval(() => {
    void runCycle().catch((error) => {
      console.error("[reminder-worker] cycle failed", error)
    })
  }, safeInterval)

  const shutdown = () => {
    clearInterval(timer)
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

main().catch((error) => {
  console.error("[reminder-worker] failed", error)
  process.exit(1)
})

