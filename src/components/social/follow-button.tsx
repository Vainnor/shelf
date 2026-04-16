"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { followUserByUsername, unfollowUserByUsername } from "@/src/actions/social"
import { Button } from "@/src/components/ui/button"

type FollowButtonProps = {
  username: string
  isFollowing: boolean
}

export default function FollowButton({ username, isFollowing }: FollowButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
	setPending(true)
	try {
	  if (isFollowing) {
		await unfollowUserByUsername(username)
		toast.success(`Unfollowed @${username}`)
	  } else {
		await followUserByUsername(username)
		toast.success(`Now following @${username}`)
	  }
	  router.refresh()
	} catch (error) {
	  toast.error(error instanceof Error ? error.message : "Action failed")
	} finally {
	  setPending(false)
	}
  }

  return (
	<Button variant={isFollowing ? "outline" : "default"} disabled={pending} onClick={() => void handleClick()}>
	  {pending ? "Saving..." : isFollowing ? "Following" : "Follow"}
	</Button>
  )
}

