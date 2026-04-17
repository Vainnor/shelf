"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/src/components/ui/button"

type ConfirmDeleteButtonProps = {
  onConfirmAction: () => Promise<void> | void
  label?: string
  pendingLabel?: string
  confirmPrompt?: string
  successMessage?: string
  errorMessage?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

const RESET_MS = 5000

export default function ConfirmDeleteButton({
  onConfirmAction,
  label = "Delete",
  pendingLabel = "Deleting...",
  confirmPrompt = "Click again to confirm delete.",
  successMessage,
  errorMessage = "Delete failed",
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
}: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!armed) {
      return
    }

    const timeout = window.setTimeout(() => {
      setArmed(false)
    }, RESET_MS)

    return () => window.clearTimeout(timeout)
  }, [armed])

  async function handleClick() {
    if (disabled || pending) {
      return
    }

    if (!armed) {
      setArmed(true)
      toast.warning(confirmPrompt)
      return
    }

    setPending(true)
    try {
      await onConfirmAction()
      if (successMessage) {
        toast.success(successMessage)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
    } finally {
      setPending(false)
      setArmed(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={armed ? "destructive" : variant}
      className={className}
      onClick={() => void handleClick()}
      disabled={disabled || pending}
    >
      {pending ? pendingLabel : armed ? "Confirm delete" : label}
    </Button>
  )
}

