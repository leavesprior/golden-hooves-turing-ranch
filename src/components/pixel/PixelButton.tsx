'use client'
import Link from 'next/link'

export type PixelButtonProps = {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'gold' | 'green' | 'orange' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const variantStyles = {
  gold: 'bg-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-light)] text-[var(--pixel-bg-dark)] border-[var(--pixel-gold-dark)]',
  green: 'bg-[var(--pixel-forest-mid)] hover:bg-[var(--pixel-forest-light)] text-white border-[var(--pixel-forest-dark)]',
  orange: 'bg-[var(--pixel-fire-orange)] hover:bg-[var(--pixel-gold-mid)] text-white border-[var(--pixel-earth-dark)]',
  blue: 'bg-[var(--pixel-ui-border)] hover:bg-[var(--pixel-sky-light)] text-white border-[var(--pixel-ui-bg)]',
}

const sizeStyles = {
  sm: 'px-3 py-2 text-[12px] sm:text-[14px]',
  md: 'px-4 py-3 text-[14px] sm:text-[16px]',
  lg: 'px-6 py-4 text-[16px] sm:text-[18px]',
}

export default function PixelButton({
  children,
  href,
  onClick,
  variant = 'gold',
  size = 'md',
  disabled = false,
  className = '',
}: PixelButtonProps) {
  const baseStyles = `font-[var(--font-pixel)] border-b-4 transition-all duration-150 pixel-btn-press inline-block text-center ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`

  if (href && !disabled) {
    return (
      <Link href={href} className={baseStyles}>
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
    >
      {children}
    </button>
  )
}
