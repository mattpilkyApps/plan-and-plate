import { useState } from 'react'
import { Utensils } from 'lucide-react'
export default function RecipeImage({ recipe, className = '', eager = false }) {
  const [failedImage, setFailedImage] = useState('')
  const source = recipe?.image
  return <div className={`recipe-image ${className}`}>
    {source && failedImage !== source ? <img src={source} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedImage(source)} />
      : <span className="recipe-placeholder" aria-hidden="true">{recipe?.icon || <Utensils strokeWidth={1.2} size={28} />}</span>}
  </div>
}
