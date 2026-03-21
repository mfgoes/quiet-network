import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-quiet-slate">Page not found</h1>
        <Link href="/" className="mt-4 block text-sm text-quiet-accent hover:underline">
          Go home
        </Link>
      </div>
    </div>
  )
}
