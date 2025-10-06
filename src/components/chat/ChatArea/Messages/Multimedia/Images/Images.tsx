import { memo } from 'react'

import { type ImageData } from '@/types/os'
import { cn } from '@/lib/utils'

const Images = ({ images }: { images: ImageData[] }) => (
  <div
    className={cn(
      'grid max-w-xl gap-4',
      images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
    )}
  >
    {images.map((image) => (
      <div key={image.url} className="group relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.revised_prompt || 'AI generated image'}
          className="w-full rounded-lg"
          onError={(e) => {
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.innerHTML = `
                    <div class="flex h-40 flex-col items-center justify-center gap-2 rounded-md bg-secondary/50 text-muted" >
                      <p class="text-primary">Image unavailable</p>
                      <a href="${image.url}" target="_blank" class="max-w-md truncate underline text-primary text-xs w-full text-center p-2">
                        ${image.url}
                      </a>
                    </div>
                  `
            }
          }}
        />
      </div>
    ))}
  </div>
)

export default memo(Images)

Images.displayName = 'Images'
