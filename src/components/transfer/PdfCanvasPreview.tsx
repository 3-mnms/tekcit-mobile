import React, { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type Props = {
  fileUrl: string
  onReady?: () => void
  className?: string
}

const QUALITY_BOOST = 1.5; // 1.25~2 사이 추천
const MAX_CANVAS_PIXELS = 8_000_000; // 8MP 안전선 (메모리/성능 보호)

const PdfCanvasPreview: React.FC<Props> = ({ fileUrl, onReady, className }) => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cleanupRef = useRef<() => void>(() => {})

  useEffect(() => {
    let cancelled = false
    let pdfDoc: any
    let page: any
    let ro: ResizeObserver | null = null
    let rendering = false

    ;(async () => {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl
      pdfDoc = await (pdfjsLib as any).getDocument({ url: fileUrl }).promise
      if (cancelled) return
      page = await pdfDoc.getPage(1)
      if (cancelled) return

      const host = hostRef.current!
      const canvas = (canvasRef.current ||= document.createElement('canvas'))
      const ctx = canvas.getContext('2d', { alpha: false })!

      // 캔버스를 호스트에 붙이기 (최초 1회)
      if (!host.contains(canvas)) {
        host.innerHTML = ''
        host.appendChild(canvas)
        canvas.style.display = 'block'
        canvas.style.objectFit = 'contain'
        canvas.style.maxWidth = '100%'
        canvas.style.maxHeight = '100%'
        // 스무딩 품질
        ;(ctx as any).imageSmoothingEnabled = true
        ;(ctx as any).imageSmoothingQuality = 'high'
      }

      const renderOnce = async () => {
        if (cancelled || rendering) return
        rendering = true
        try {
          const parentW = Math.max(1, host.clientWidth)
          const parentH = Math.max(1, host.clientHeight)

          // 1) CSS 기준 뷰포트 맞추기
          const baseViewport = page.getViewport({ scale: 1 })
          const cssScale = Math.min(parentW / baseViewport.width, parentH / baseViewport.height) || 1
          const cssViewport = page.getViewport({ scale: cssScale })

          // 2) 실제 픽셀 수(HiDPI) 계산
          const dpr = Math.min(window.devicePixelRatio || 1, 2.5) // 과도한 dpr 제한
          const pxScale = dpr * QUALITY_BOOST
          const targetW = Math.floor(cssViewport.width * pxScale)
          const targetH = Math.floor(cssViewport.height * pxScale)

          // 3) 캔버스 픽셀 과다 방지(메모리 보호)
          let finalW = targetW
          let finalH = targetH
          if (finalW * finalH > MAX_CANVAS_PIXELS) {
            const shrink = Math.sqrt((finalW * finalH) / MAX_CANVAS_PIXELS)
            finalW = Math.floor(finalW / shrink)
            finalH = Math.floor(finalH / shrink)
          }

          // 4) 캔버스 실제 픽셀 크기 & CSS 크기 분리
          canvas.width = Math.max(1, finalW)
          canvas.height = Math.max(1, finalH)
          canvas.style.width = `${Math.floor(cssViewport.width)}px`
          canvas.style.height = `${Math.floor(cssViewport.height)}px`

          // 5) pdf.js 렌더 (transform으로 추가 스케일 적용)
          const renderViewport = page.getViewport({ scale: cssScale })
          const scaleX = canvas.width / renderViewport.width
          const scaleY = canvas.height / renderViewport.height

          await page.render({
            canvasContext: ctx,
            viewport: renderViewport,
            // HiDPI 스케일을 transform으로 전달하면 텍스트/선 더 또렷!
            transform: [scaleX, 0, 0, scaleY, 0, 0],
            intent: 'print', // 'display'보다 선명 (크롬에서 뚜렷)
            enableWebGL: false
          }).promise

          onReady?.()
        } finally {
          rendering = false
        }
      }

      await renderOnce()

      // 리사이즈/모달 크기 변화 시 재렌더
      ro = new ResizeObserver(() => {
        // aF로 프레임 단위 스로틀
        requestAnimationFrame(renderOnce)
      })
      ro.observe(host)

      // 정리자 등록
      cleanupRef.current = () => {
        try { ro?.disconnect() } catch {}
        try { pdfDoc?.destroy?.() } catch {}
      }
    })().catch(() => onReady?.())

    return () => {
      cancelled = true
      cleanupRef.current?.()
    }
  }, [fileUrl, onReady])

  return (
    <div ref={hostRef} className={className} style={{ display: 'grid', placeItems: 'center' }} />
  )
}

export default PdfCanvasPreview
