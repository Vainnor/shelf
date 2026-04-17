"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/src/components/ui/button"

type ConfirmDeleteSubmitButtonProps = {
  label?: string
  confirmPrompt?: string
  className?: string
  disabled?: boolean
  pending?: boolean
}

const RESET_MS = 5000

export default function ConfirmDeleteSubmitButton({
  label = "Delete",
  confirmPrompt = "Click again to confirm delete.",
  className,
  disabled = false,
  pending = false,
}: ConfirmDeleteSubmitButtonProps) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) {
      return
    }

    const timeout = window.setTimeout(() => {
      setArmed(false)
    }, RESET_MS)

    return () => window.clearTimeout(timeout)
  }, [armed])

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (disabled || pending) {
      return
    }

    if (!armed) {
      event.preventDefault()
      setArmed(true)
      toast.warning(confirmPrompt)
      return
    }

    setArmed(false)
    const form = event.currentTarget.form
    if (form) {
      form.requestSubmit()
    }
  }

  return (
    <Button
      type="button"
      variant={armed ? "destructive" : "outline"}
      className={className}
      onClick={handleClick}
      disabled={disabled || pending}
    >
      {pending ? "Deleting..." : armed ? "Confirm delete" : label}
    </Button>
  )
}

