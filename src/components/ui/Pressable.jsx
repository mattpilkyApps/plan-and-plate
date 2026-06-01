import { Link } from 'react-router-dom'

const baseClasses =
  'premium-press inline-flex items-center justify-center gap-2 font-bold outline-none focus-visible:ring-4 focus-visible:ring-[#EAF3DE] disabled:shadow-none disabled:opacity-55'

const variantClasses = {
  primary:
    'bg-[#5A8D2B] text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)] hover:shadow-[0_16px_30px_rgba(90,141,43,0.24)]',
  secondary:
    'border border-green-100 bg-[#EAF3DE] text-[#5A8D2B] shadow-sm hover:bg-[#DFEFCF]',
  surface:
    'border border-stone-100 bg-white text-stone-800 shadow-sm hover:shadow-[0_10px_22px_rgba(30,41,59,0.08)]',
  ghost: 'text-stone-700 hover:bg-stone-100/70',
  danger:
    'border border-red-100 bg-red-50 text-red-600 shadow-sm hover:bg-red-100/70',
  dangerSolid:
    'bg-red-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.22)] hover:bg-red-700',
  icon: 'bg-white text-stone-700 shadow-sm hover:shadow-[0_10px_22px_rgba(30,41,59,0.08)]',
}

const sizeClasses = {
  sm: 'min-h-10 rounded-2xl px-3 py-2 text-sm',
  md: 'min-h-12 rounded-2xl px-4 py-3 text-base',
  lg: 'min-h-14 rounded-2xl px-4 py-3 text-base',
  icon: 'h-11 w-11 rounded-2xl p-0',
  iconLg: 'h-[3.25rem] w-[3.25rem] rounded-2xl p-0',
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Pressable({
  as,
  children,
  className = '',
  disabled,
  size = 'md',
  to,
  type = 'button',
  variant = 'surface',
  ...props
}) {
  const Component = as || (to ? Link : 'button')
  const componentProps = {
    className: joinClasses(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ),
    ...props,
  }

  if (to) {
    componentProps.to = to
    componentProps['aria-disabled'] = disabled || undefined
  } else if (Component === 'button') {
    componentProps.disabled = disabled
    componentProps.type = type
  }

  return <Component {...componentProps}>{children}</Component>
}

export default Pressable
