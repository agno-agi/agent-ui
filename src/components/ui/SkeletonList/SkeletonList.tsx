import { useMemo } from 'react'

import { FC } from 'react'
import { Skeleton } from '@/components/ui/SkeletonList/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonListProps {
  skeletonCount: number
}

export const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  return skeletons.map((skeleton, index) => (
    <Skeleton
      key={skeleton}
      className={cn(
        'mx-3 mb-1 h-11 rounded-lg px-3 py-2',
        index > 0 && 'bg-background-secondary'
      )}
    />
  ))
}
