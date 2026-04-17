"use client"

import { ExternalLink, Megaphone, X } from "lucide-react"
import { useMemo, useState } from "react"

import { markCurrentReleaseAnnouncementSeen } from "@/src/actions/release-announcements"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

type ReleaseAnnouncementModalProps = {
  release: {
    id: string
    versionKey: string
    title: string
    body: string
    releaseLink: string | null
    imageUrls: string[]
  }
}

export default function ReleaseAnnouncementModal({ release }: ReleaseAnnouncementModalProps) {
  const [open, setOpen] = useState(true)

  const imageUrls = useMemo(
    () => release.imageUrls.filter((url) => url.length > 0),
    [release.imageUrls]
  )

  async function markSeen() {
    const formData = new FormData()
    formData.set("releaseId", release.id)
    await markCurrentReleaseAnnouncementSeen(formData)
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto border-border/70">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Megaphone className="size-5" />
                {release.title}
              </CardTitle>
              <CardDescription>Release {release.versionKey}</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(false)
                void markSeen()
              }}
              aria-label="Close release announcement"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{release.body}</p>

          {imageUrls.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {imageUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={`Release ${release.versionKey} preview`}
                  className="h-40 w-full rounded-md border border-border/70 object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {release.releaseLink ? (
              <a
                href={release.releaseLink}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "default" }), "gap-2")}
                onClick={() => {
                  void markSeen()
                }}
              >
                <ExternalLink className="size-4" />
                View release notes
              </a>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                void markSeen()
              }}
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

