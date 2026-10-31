import { Link } from 'react-router-dom'

export default function Pressable({
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
  const Component = as || (to && !disabled ? Link : 'button')
  const componentProps = {
    ...props,
    className: `button button-${variant} button-${size} ${className}`,
  }
  if (Component === Link) componentProps.to = to
  if (Component === 'button') Object.assign(componentProps, { type, disabled })
  return <Component {...componentProps}>{children}</Component>
}
