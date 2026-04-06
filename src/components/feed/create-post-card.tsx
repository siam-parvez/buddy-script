'use client'

import { ImagePlus, Send } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { createPost } from '@/app/(feed)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { AvatarChip } from './avatar-chip'

type CreatePostCardProps = {
  currentUserName: string
  currentUserAvatarUrl?: string | null
}

export function CreatePostCard({ currentUserName, currentUserAvatarUrl }: CreatePostCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setPreviewName(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)
    setPreviewName(file.name)
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewName(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-start gap-3">
        <AvatarChip name={currentUserName} avatarUrl={currentUserAvatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Create post</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Share an update, add an image, or keep it private.</p>
        </div>
      </div>

      <form action={createPost} className="mt-4 space-y-3">
        <Textarea
          name="content"
          rows={4}
          placeholder={`What's on your mind, ${currentUserName}?`}
          className="w-full resize-none rounded-[18px] border-0 bg-slate-50 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:ring-1 focus:ring-[#e4e8ff] dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        {previewUrl ? (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={previewName ?? 'Selected upload preview'} className="h-72 w-full object-cover" />
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800 dark:text-slate-100">{previewName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Preview ready to post</p>
              </div>
              <Button
                type="button"
                onClick={clearPreview}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
          <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80">
            <ImagePlus className="h-4 w-4 text-primary dark:text-sky-300" />
            Photo/video
            <Input
              ref={inputRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            <Select
              id="visibility"
              name="visibility"
              defaultValue="public"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            Public posts are visible to your network. Private stays on your profile.
          </p>
          <Button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
          >
            <Send className="h-4 w-4" />
            Post
          </Button>
        </div>
      </form>
    </article>
  )
}


