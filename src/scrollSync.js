import { useEffect, useMemo, useRef, useState } from 'react'
import { useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export const SCENE_ORDER = ['intro', 'chairs', 'tables']

export const clamp01 = (value) => Math.min(1, Math.max(0, value))

export const easing = {
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t) => t
}

const getSceneMeta = (sceneOrder = SCENE_ORDER) => {
  const count = Math.max(sceneOrder.length, 1)
  const spacing = count > 1 ? 1 / (count - 1) : 1
  const indexMap = sceneOrder.reduce((acc, id, idx) => {
    acc[id] = idx
    return acc
  }, {})
  return { sceneOrder, count, spacing, indexMap }
}

export const calcSceneWindow = (sceneId, widthMultiplier = 1, sceneOrder = SCENE_ORDER) => {
  const { count, spacing, indexMap } = getSceneMeta(sceneOrder)
  const index = indexMap[sceneId]
  if (index === undefined) {
    return { start: 0, center: 0, end: 0 }
  }
  const center = count > 1 ? index * spacing : 0
  const width = spacing * widthMultiplier
  const half = width / 2
  return {
    start: clamp01(center - half),
    center,
    end: clamp01(center + half)
  }
}

export const calcWindowProgress = (offset, start, end, { ease = easing.easeInOutCubic } = {}) => {
  if (end - start === 0) return 0
  const raw = clamp01((offset - start) / (end - start))
  return ease ? ease(raw) : raw
}

export const calcSceneProgress = (
  offset,
  sceneId,
  { widthMultiplier = 1, window: windowOverride, ease = easing.easeInOutCubic, sceneOrder = SCENE_ORDER } = {}
) => {
  const window = windowOverride ?? calcSceneWindow(sceneId, widthMultiplier, sceneOrder)
  return calcWindowProgress(offset, window.start, window.end, { ease })
}

export const useScrollOffsetValue = (threshold = 0.0005) => {
  const scroll = useScroll()
  const [offset, setOffset] = useState(() => scroll?.offset ?? 0)

  const lastRef = useRef(offset)

  useFrame(() => {
    const next = scroll?.offset ?? 0
    if (Math.abs(lastRef.current - next) > threshold) {
      lastRef.current = next
      setOffset(next)
    }
  })

  return offset
}

export const useScrollSnap = (sceneOrder = SCENE_ORDER, { debounce = 600 } = {}) => {
  const scroll = useScroll()
  const meta = useMemo(() => getSceneMeta(sceneOrder), [sceneOrder])
  const stateRef = useRef({ targetIndex: 0, animating: false, timeoutId: null })

  useEffect(() => {
    if (!scroll?.el || meta.count < 2) return
    const el = scroll.el

    stateRef.current.targetIndex = Math.round((scroll.offset ?? 0) / meta.spacing)

    const getScrollLength = () => Math.max(0, el.scrollHeight - el.clientHeight)

    const scrollToIndex = (index) => {
      const clamped = Math.min(meta.count - 1, Math.max(0, index))
      stateRef.current.targetIndex = clamped
      const targetOffset = clamped * meta.spacing
      const targetTop = targetOffset * getScrollLength()
      stateRef.current.animating = true
      el.scrollTo({ top: targetTop, behavior: 'smooth' })
      if (stateRef.current.timeoutId) clearTimeout(stateRef.current.timeoutId)
      stateRef.current.timeoutId = setTimeout(() => {
        stateRef.current.animating = false
      }, debounce)
    }

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) < 5) return
      event.preventDefault()
      if (stateRef.current.animating) return
      const direction = event.deltaY > 0 ? 1 : -1
      const next = stateRef.current.targetIndex + direction
      if (next < 0 || next > meta.count - 1) return
      scrollToIndex(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      if (stateRef.current.timeoutId) clearTimeout(stateRef.current.timeoutId)
    }
  }, [scroll, meta, debounce])
}
