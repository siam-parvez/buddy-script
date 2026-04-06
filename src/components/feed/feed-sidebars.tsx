import { Heart, Home, ImagePlus, MessageSquare, Users2 } from 'lucide-react'

export function LeftSidebar() {
  return (
    <aside className="hidden min-h-0 lg:col-span-3 lg:block lg:h-full lg:overflow-y-auto lg:pr-1">
      <div className="space-y-4 pb-4 mt-12">
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Explore</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-3 rounded-2xl bg-[#f4f6ff] px-3 py-2 font-medium text-primary dark:bg-slate-800/80 dark:text-sky-300">
              <Home className="h-4 w-4" />
              Home feed
            </li>
            <li className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Insights
            </li>
            <li className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <Users2 className="h-4 w-4 text-slate-400" />
              Find friends
            </li>
            <li className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <Heart className="h-4 w-4 text-slate-400" />
              Bookmarks
            </li>
          </ul>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Shortcuts</h3>
          <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex gap-3 rounded-2xl border border-dashed border-[#dce1ff] bg-[#f8f9ff] px-3 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <ImagePlus className="mt-0.5 h-4 w-4 flex-none text-primary dark:text-sky-300" />
              <span>Create a post, share an image, and keep your feed public or private.</span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}

export function RightSidebar() {
  return (
    <aside className="hidden min-h-0 lg:col-span-3 lg:block lg:h-full lg:overflow-y-auto lg:pl-1">
      <div className="space-y-4 pb-4 mt-12">
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">You Might Like</h3>
          <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="rounded-2xl border border-dashed border-[#dce1ff] bg-[#f8f9ff] px-3 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              Suggested people and widgets goes here.
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your Friends</h3>
          <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
              <Users2 className="mt-0.5 h-4 w-4 flex-none text-primary dark:text-sky-300" />
              <span>Friend list goes here.</span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}



