import Image from 'next/image'

export function FeedBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(91,99,255,0.16),transparent_68%)] dark:bg-[radial-gradient(circle_at_top,rgba(91,99,255,0.18),transparent_64%)]" />
      <Image src="/auth/shape1.svg" alt="" width={208} height={208} className="absolute left-0 top-0 hidden w-52 select-none lg:block dark:hidden" />
      <Image src="/auth/shape2.svg" alt="" width={224} height={224} className="absolute right-0 top-0 hidden w-56 select-none lg:block dark:hidden" />
      <Image
        src="/auth/shape3.svg"
        alt=""
        width={192}
        height={192}
        className="absolute bottom-0 left-1/2 hidden w-48 -translate-x-1/2 select-none lg:block dark:hidden"
      />
      <Image src="/auth/dark_shape.svg" alt="" width={208} height={208} className="absolute right-8 top-8 hidden w-48 select-none dark:block" />
      <Image src="/auth/dark_shape1.svg" alt="" width={224} height={224} className="absolute bottom-0 left-0 hidden w-52 select-none dark:block" />
      <Image src="/auth/dark_shape2.svg" alt="" width={192} height={192} className="absolute bottom-12 right-1/4 hidden w-44 select-none dark:block" />
    </div>
  )
}


