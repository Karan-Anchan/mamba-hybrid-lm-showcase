import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import type { Ratio } from '../data/evidence'

const phaseSettings = {
  '1:3': { decay: 0.84, cadence: 4, colors: ['#74dcff', '#d7ff39', '#ff5d2e'] },
  '1:7': { decay: 0.91, cadence: 8, colors: ['#9c7cff', '#3b63ff', '#ff4db8'] },
  '1:15': { decay: 0.96, cadence: 16, colors: ['#ff5d2e', '#ffca3a', '#74dcff'] },
} as const

function seeded(index: number, salt: number) {
  return (Math.sin(index * 127.1 + salt * 311.7) * 43758.5453) % 1
}

export function PhasePortrait({ ratio }: { ratio: Ratio }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef({ x: 0.72, y: 0.42 })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const acquiredCanvas = canvasRef.current
    if (!acquiredCanvas || typeof window.CanvasRenderingContext2D === 'undefined') return
    const canvas: HTMLCanvasElement = acquiredCanvas
    const acquiredContext = canvas.getContext('2d')
    if (!acquiredContext) return
    const context: CanvasRenderingContext2D = acquiredContext

    const settings = phaseSettings[ratio]
    let width = 1
    let height = 1
    let animation = 0

    function resize() {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(bounds.width, 1)
      height = Math.max(bounds.height, 1)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    function draw(timestamp: number) {
      const time = reduceMotion ? 0.4 : timestamp * 0.00022
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'screen'
      context.lineCap = 'round'

      for (let band = 0; band < 28; band += 1) {
        const color = settings.colors[band % settings.colors.length]
        const base = (band + 0.7) / 29
        let state = seeded(band, settings.cadence) * 0.8
        context.beginPath()

        for (let step = 0; step <= 92; step += 1) {
          const progress = step / 92
          const input = Math.sin(progress * (8 + band * 0.17) + time * (1.4 + band * 0.013))
          state = settings.decay * state + (1 - settings.decay) * input
          const pull = Math.exp(-Math.pow(progress - pointerRef.current.x, 2) * 16)
          const x = progress * width
          const y = height * (
            base
            + state * (0.11 + 0.035 * Math.sin(band))
            + Math.sin(progress * 13 + band * 0.9 + time) * 0.012
            + pull * (pointerRef.current.y - base) * 0.11
          )
          if (step === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }

        context.strokeStyle = color
        context.globalAlpha = 0.14 + (band % settings.cadence === 0 ? 0.34 : 0.08)
        context.lineWidth = band % settings.cadence === 0 ? 1.7 : 0.65
        context.stroke()
      }

      for (let marker = settings.cadence; marker <= 16; marker += settings.cadence) {
        const x = width * (marker / 17)
        const pulse = reduceMotion ? 0.7 : 0.45 + 0.35 * Math.sin(time * 7 + marker)
        const gradient = context.createLinearGradient(x, height * 0.16, x, height * 0.82)
        gradient.addColorStop(0, 'rgba(116, 220, 255, 0)')
        gradient.addColorStop(0.5, `rgba(215, 255, 57, ${pulse})`)
        gradient.addColorStop(1, 'rgba(255, 93, 46, 0)')
        context.globalAlpha = 0.55
        context.fillStyle = gradient
        context.fillRect(x - 0.75, height * 0.16, 1.5, height * 0.66)
      }

      for (let packet = 0; packet < 12; packet += 1) {
        const lane = (packet * 7 + settings.cadence) % 28
        const position = reduceMotion ? (packet + 1) / 13 : (time * 0.22 + packet / 12) % 1
        const sampleCount = Math.max(1, Math.round(position * 92))
        const base = (lane + 0.7) / 29
        let state = seeded(lane, settings.cadence) * 0.8

        for (let step = 0; step <= sampleCount; step += 1) {
          const progress = step / 92
          const input = Math.sin(progress * (8 + lane * 0.17) + time * (1.4 + lane * 0.013))
          state = settings.decay * state + (1 - settings.decay) * input
        }

        const pull = Math.exp(-Math.pow(position - pointerRef.current.x, 2) * 16)
        const packetX = position * width
        const packetY = height * (
          base
          + state * (0.11 + 0.035 * Math.sin(lane))
          + Math.sin(position * 13 + lane * 0.9 + time) * 0.012
          + pull * (pointerRef.current.y - base) * 0.11
        )
        const packetRadius = 1.6 + (packet % settings.cadence === 0 ? 1.2 : 0)

        context.fillStyle = settings.colors[packet % settings.colors.length]
        context.globalAlpha = 0.16
        context.beginPath()
        context.arc(packetX, packetY, packetRadius * 3.2, 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = 0.82
        context.beginPath()
        context.arc(packetX, packetY, packetRadius, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      if (!reduceMotion) animation = window.requestAnimationFrame(draw)
    }

    resize()
    draw(0)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(canvas)
    if (!observer) window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(animation)
      observer?.disconnect()
      if (!observer) window.removeEventListener('resize', resize)
    }
  }, [ratio, reduceMotion])

  return (
    <div
      className="phase-portrait"
      data-visual="illustrative-phase-field"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        pointerRef.current = {
          x: (event.clientX - bounds.left) / Math.max(bounds.width, 1),
          y: (event.clientY - bounds.top) / Math.max(bounds.height, 1),
        }
      }}
      onPointerLeave={() => { pointerRef.current = { x: 0.72, y: 0.42 } }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
