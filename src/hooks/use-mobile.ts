import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 1024 // ориентир для устройств < ~10"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Хук для определения мобильного сенсорного устройства (<~10" диагональ, coarse pointer/touch).
 * Использует несколько эвристик: ширина экрана, наличие coarse pointer, touch points.
 */
export function useIsTouchMobile() {
  const [isTouchMobile, setIsTouchMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const urlForceMobile = (() => {
      try {
        const usp = new URLSearchParams(window.location.search)
        return usp.get('mobile') === '1'
      } catch {
        return false
      }
    })()
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const hasTouch = navigator.maxTouchPoints > 0
    const isSmall = window.innerWidth < MOBILE_BREAKPOINT

    const evaluate = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches
      const small = window.innerWidth < MOBILE_BREAKPOINT
      const touch = navigator.maxTouchPoints > 0
      setIsTouchMobile(urlForceMobile || ((coarse || touch) && small))
    }

    // начальная оценка
    setIsTouchMobile(urlForceMobile || ((hasCoarsePointer || hasTouch) && isSmall))

    const resizeHandler = () => evaluate()
    window.addEventListener('resize', resizeHandler)
    const pointerMql = window.matchMedia('(pointer: coarse)')
    const pointerHandler = () => evaluate()
    pointerMql.addEventListener('change', pointerHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      pointerMql.removeEventListener('change', pointerHandler)
    }
  }, [])

  return !!isTouchMobile
}
