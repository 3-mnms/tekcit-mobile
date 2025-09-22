import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type Props = { fileUrl: string; onReady?: () => void; className?: string }

const QUALITY_BOOST = 1.4
const MAX_CANVAS_PIXELS = 8_000_000
const MIN_ZOOM = 0.8
const MAX_ZOOM = 4

function useDebounce(cb: () => void, deps: any[], ms = 150) {
  const t = useRef<number | null>(null)
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current)
    t.current = window.setTimeout(cb, ms)
    return () => { if (t.current) window.clearTimeout(t.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

const PdfCanvasPreview: React.FC<Props> = ({ fileUrl, onReady, className }) => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfRef = useRef<any>(null)
  const pageRef = useRef<any>(null)
  const baseCssRef = useRef({ w: 0, h: 0 })

  // 시각 확대/이동(즉시 반영)
  const [zoom, setZoom] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const panRef = useRef({ dragging: false, startX: 0, startY: 0, baseTx: 0, baseTy: 0 })
  const pinchRef = useRef({ tracking: false, startDist: 0, startZoom: 1 })

  // 기본 렌더 (현재 host 크기에 맞춘 “기본 크기”로만 그림)
  const renderBase = async () => {
    const host = hostRef.current
    const page = pageRef.current
    if (!host || !page) return

    const canvas = (canvasRef.current ||= document.createElement('canvas'))
    if (!host.contains(canvas)) {
      host.innerHTML = ''
      host.appendChild(canvas)
      canvas.style.display = 'block'
      canvas.style.maxWidth = 'none'
      canvas.style.maxHeight = 'none'
      canvas.style.willChange = 'transform'
    }

    const ctx = canvas.getContext('2d', { alpha: false })!
      ; (ctx as any).imageSmoothingEnabled = true
      ; (ctx as any).imageSmoothingQuality = 'high'

    const parentW = Math.max(1, host.clientWidth)
    const parentH = Math.max(1, host.clientHeight)
    const baseViewport = page.getViewport({ scale: 1 })

    // host에 딱 맞는 “기본 CSS 크기”
    const cssScale = Math.min(parentW / baseViewport.width, parentH / baseViewport.height) || 1
    const cssViewport = page.getViewport({ scale: cssScale })

    // 실제 픽셀 (DPR * QUALITY_BOOST) — zoom은 여기선 미반영(=가벼움)
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    let targetW = Math.floor(cssViewport.width * dpr * QUALITY_BOOST)
    let targetH = Math.floor(cssViewport.height * dpr * QUALITY_BOOST)
    if (targetW * targetH > MAX_CANVAS_PIXELS) {
      const k = Math.sqrt((targetW * targetH) / MAX_CANVAS_PIXELS)
      targetW = Math.floor(targetW / k)
      targetH = Math.floor(targetH / k)
    }

    canvas.width = Math.max(1, targetW)
    canvas.height = Math.max(1, targetH)
    canvas.style.width = `${Math.floor(cssViewport.width)}px`
    canvas.style.height = `${Math.floor(cssViewport.height)}px`

    baseCssRef.current = {
      w: Math.floor(cssViewport.width),
      h: Math.floor(cssViewport.height),
    }

    const renderViewport = page.getViewport({ scale: cssScale })
    const sx = canvas.width / renderViewport.width
    const sy = canvas.height / renderViewport.height

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      transform: [sx, 0, 0, sy, 0, 0],
      intent: 'print',
      enableWebGL: false
    }).promise

    onReady?.()
  }

  const renderHires = async () => {
    const host = hostRef.current
    const page = pageRef.current
    const canvas = canvasRef.current
    if (!host || !page || !canvas) return

    // 최신 렌더 토큰
    const token = ++renderTokenRef.current

    const ctx = canvas.getContext('2d', { alpha: false })!

    // 1) 기본 CSS 크기는 그대로! (transform: scale(zoom)으로만 보이는 크기 변경)
    const { w: cssW, h: cssH } = baseCssRef.current
    if (!cssW || !cssH) return

    // 2) 내부 픽셀만 zoom 만큼 업스케일
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    let targetW = Math.floor(cssW * dpr * QUALITY_BOOST * zoom)
    let targetH = Math.floor(cssH * dpr * QUALITY_BOOST * zoom)
    if (targetW * targetH > MAX_CANVAS_PIXELS) {
      const k = Math.sqrt((targetW * targetH) / MAX_CANVAS_PIXELS)
      targetW = Math.floor(targetW / k)
      targetH = Math.floor(targetH / k)
    }

    canvas.width = Math.max(1, targetW)
    canvas.height = Math.max(1, targetH)

    // ✅ CSS 사이즈는 유지 (중요)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    // 3) pdf.js 렌더: 뷰포트 스케일엔 zoom 반영
    const parentW = Math.max(1, host.clientWidth)
    const parentH = Math.max(1, host.clientHeight)
    const baseViewport = page.getViewport({ scale: 1 })
    const cssScale = Math.min(parentW / baseViewport.width, parentH / baseViewport.height) || 1

    const renderViewport = page.getViewport({ scale: cssScale * zoom })
    const sx = canvas.width / renderViewport.width
    const sy = canvas.height / renderViewport.height

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      transform: [sx, 0, 0, sy, 0, 0],
      intent: 'print',
      enableWebGL: false
    }).promise

    // 토큰 검사: 오래된 렌더면 무시
    if (token !== renderTokenRef.current) return
  }

  // 초기 로드
  useEffect(() => {
    let cancelled = false
    let ro: ResizeObserver | null = null

      ; (async () => {
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl
        const pdfDoc = await (pdfjsLib as any).getDocument({ url: fileUrl }).promise
        if (cancelled) return
        pdfRef.current = pdfDoc
        pageRef.current = await pdfDoc.getPage(1)
        if (cancelled) return

        await renderBase()

        ro = new ResizeObserver(() => { renderBase() })
        if (hostRef.current) ro.observe(hostRef.current)
      })()

    return () => {
      cancelled = true
      try { ro?.disconnect() } catch { }
      try { pdfRef.current?.destroy?.() } catch { }
    }
  }, [fileUrl])

  // CSS transform으로 즉시 확대/이동
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`
      canvas.style.transformOrigin = 'center center'
    }
  }, [zoom, tx, ty])

  const renderTokenRef = useRef(0)

  // zoom 변할 때 품질 업스케일은 디바운스로 렌더
  useDebounce(() => { renderHires() }, [zoom])

  // 입력 이벤트(휠/핀치/드래그)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 - Math.sign(e.deltaY) * 0.12)))
      setZoom(next)
    }
    const onPointerDown = (e: PointerEvent) => {
      ; (e.target as Element).setPointerCapture?.(e.pointerId)
      panRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, baseTx: tx, baseTy: ty }
      host.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!panRef.current.dragging) return
      setTx(panRef.current.baseTx + (e.clientX - panRef.current.startX))
      setTy(panRef.current.baseTy + (e.clientY - panRef.current.startY))
    }
    const onPointerUp = () => { panRef.current.dragging = false; host.style.cursor = 'grab' }

    const dist = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        pinchRef.current = { tracking: true, startDist: dist(e.touches[0], e.touches[1]), startZoom: zoom }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pinchRef.current.tracking || e.touches.length !== 2) return
      e.preventDefault()
      const factor = dist(e.touches[0], e.touches[1]) / (pinchRef.current.startDist || 1)
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.startZoom * factor))
      setZoom(next)
    }
    const onTouchEnd = () => { pinchRef.current.tracking = false }

    const prevent = (ev: Event) => ev.preventDefault()

    host.addEventListener('wheel', onWheel, { passive: false })
    host.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    host.addEventListener('touchstart', onTouchStart, { passive: false })
    host.addEventListener('touchmove', onTouchMove, { passive: false })
    host.addEventListener('touchend', onTouchEnd)
    host.addEventListener('gesturestart', prevent as any, { passive: false })
    host.addEventListener('gesturechange', prevent as any, { passive: false })
    host.addEventListener('gestureend', prevent as any, { passive: false })

    return () => {
      host.removeEventListener('wheel', onWheel as any)
      host.removeEventListener('pointerdown', onPointerDown as any)
      window.removeEventListener('pointermove', onPointerMove as any)
      window.removeEventListener('pointerup', onPointerUp as any)
      host.removeEventListener('touchstart', onTouchStart as any)
      host.removeEventListener('touchmove', onTouchMove as any)
      host.removeEventListener('touchend', onTouchEnd as any)
      host.removeEventListener('gesturestart', prevent as any)
      host.removeEventListener('gesturechange', prevent as any)
      host.removeEventListener('gestureend', prevent as any)
    }
  }, [zoom, tx, ty])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: 'grab',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    />
  )
}

export default PdfCanvasPreview
