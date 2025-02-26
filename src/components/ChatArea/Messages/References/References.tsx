import React, { useRef, useState, useEffect } from 'react'

import Paragraph from '@/components/ui/typography/Paragraph'
import { type ReferencesData } from './types'
import { ArrowRightIcon } from 'lucide-react'

import ReferencesItem from './ReferencesItem'

const References = ({ references }: { references: ReferencesData[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [remainingSlides, setRemainingSlides] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const checkScroll = () => {
    const element = scrollRef.current
    if (element) {
      setShowLeftArrow(element.scrollLeft > 0)

      setShowRightArrow(
        element.scrollLeft < element.scrollWidth - element.clientWidth
      )
      const remainingPixelsOnRight =
        element.scrollWidth - (element.scrollLeft + element.clientWidth)
      const hasMoreContent =
        element.scrollLeft < element.scrollWidth - element.clientWidth
      setShowRightArrow(hasMoreContent && remainingPixelsOnRight > 50)

      if (hasMoreContent && element.firstElementChild instanceof HTMLElement) {
        const itemWidth = element?.firstElementChild.offsetWidth || 0
        const gap = 8

        // Calculate if we should show the right arrow

        const remainingPixels =
          element.scrollWidth - (element.scrollLeft + element.clientWidth)
        const remainingItems = Math.ceil(remainingPixels / (itemWidth + gap))
        setRemainingSlides(remainingItems)
      } else {
        setRemainingSlides(0)
      }
    }
  }

  useEffect(() => {
    checkScroll()

    const element = scrollRef.current
    if (element) {
      setShowRightArrow(element.scrollWidth > element.clientWidth)
    }
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    const element = scrollRef.current
    if (element) {
      const scrollAmount = element.clientWidth * 0.7
      const newScrollPosition =
        direction === 'left'
          ? element.scrollLeft - scrollAmount
          : element.scrollLeft + scrollAmount

      element.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full cursor-pointer select-none"
    >
      <div
        ref={scrollRef}
        className={`flex h-[70px] gap-2 overflow-x-auto pb-1 ${
          isHovered ? 'show-scrollbar' : 'hide-scrollbar'
        }`}
        onScroll={checkScroll}
      >
        {references?.map((item) => (
          <ReferencesItem key={item.time} references={item} />
        ))}
      </div>

      {/* Right arrow */}
      {showRightArrow && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 flex h-[63px] w-16 items-center justify-end gap-2 rounded-l-sm bg-gradient-to-l from-background via-background/60 to-transparent pb-1"
        >
          <Paragraph size="sm">{remainingSlides}</Paragraph>
          <ArrowRightIcon  size="xs" />
        </button>
      )}

      {/* Left arrow */}
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-0 flex h-[63px] w-14 items-center justify-start rounded-r-sm bg-gradient-to-r from-background via-background/60 to-transparent pb-1"
        >
          <ArrowRightIcon  size="xs" className="rotate-180" />
        </button>
      )}
    </div>
  )
}

export default References
