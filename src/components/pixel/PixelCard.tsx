'use client'

type PixelCardProps = {
  children: React.ReactNode
  title?: string
  className?: string
}

export default function PixelCard({ children, title, className = '' }: PixelCardProps) {
  return (
    <div className={`bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4 ${className}`}>
      {title && (
        <div className="border-b-2 border-[var(--pixel-ui-border)] pb-2 mb-4">
          <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
            {title}
          </h3>
        </div>
      )}
      <div className="text-[var(--pixel-ui-text)]">
        {children}
      </div>
    </div>
  )
}
