export function Shell({
  children,
  leading,
  wide,
}: {
  children: React.ReactNode
  leading?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`mx-auto min-h-screen bg-quiet-offwhite px-4 pb-20 pt-8 md:pb-8 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
      <header className={`flex items-center justify-between ${leading ? "mb-4 p-2 md:mb-8 md:p-4" : "hidden md:flex md:mb-8 md:p-4"}`}>
        <div className="w-9">{leading}</div>
        <div className="hidden md:block text-center">
          <h1 className="text-2xl font-semibold text-quiet-slate">
            Quiet Network
          </h1>
          <p className="mt-0.5 text-sm text-quiet-muted">
            Your neighborhood, without the noise
          </p>
        </div>
        <div className="w-9" />
      </header>
      {children}
    </div>
  )
}
