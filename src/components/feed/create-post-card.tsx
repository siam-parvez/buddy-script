'use client'

import { ImagePlus, Send, Globe, Lock } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { createPost } from '@/app/(feed)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { AvatarChip } from './avatar-chip'

type CreatePostCardProps = {
  currentUserName: string
  currentUserAvatarUrl?: string | null
}

export function CreatePostCard({ currentUserName, currentUserAvatarUrl }: CreatePostCardProps) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const firstName = currentUserName.trim().split(/\s+/)[0] ?? currentUserName

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      await createPost(formData)
      form.reset()
      clearPreview()
      setResetKey((value) => value + 1)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="overflow-hidden border bg-white/95  dark:bg-slate-950/80 p-0 gap-2">
      <CardHeader className="border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6">
        <div className="flex items-start gap-3">
          <AvatarChip name={currentUserName} avatarUrl={currentUserAvatarUrl} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Create a post</CardTitle>
            <CardDescription className=" text-sm text-slate-500 dark:text-slate-400">
              Share an update, add an image, and choose who can see it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form ref={formRef} onSubmit={handleSubmit}>
        <CardContent className="px-4 sm:px-6">
          <Textarea
            name="content"
            rows={8}
            placeholder={`What's on your mind, ${firstName}?`}
            className="w-full resize-none bg-slate-50 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:ring-1 focus:ring-[#e4e8ff] dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 border"
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
                <Button type="button" onClick={clearPreview} variant="outline" size="sm" className="rounded-full">
                  Remove
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <label className="w-fit flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-primary hover:bg-[#f5f7ff] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:bg-slate-800">
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

            <Select key={resetKey} name="visibility" defaultValue="public">
              <SelectTrigger className="min-h-10 flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-primary hover:bg-[#f5f7ff] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:bg-slate-800">
                <SelectValue placeholder="Public" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="public"><Globe className={"text-primary"}/> Public</SelectItem>
                  <SelectItem value="private"><Lock className={"text-primary"}/> Private</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-70"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}


