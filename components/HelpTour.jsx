'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react'

export default function HelpTour({ steps, index, onNext, onPrev, onStop }) {
  const tooltipRef = useRef(null)
  const [targetRect, setTargetRect] = useState(null)
  const [pos, setPos] = useState({ top: 20, left: 20 })

  const step = steps[index]
  const total = steps.length
  const isLast = index === total - 1
  const width = 340
  const gap = 14
  const padding = 12

  useEffect(() => {
    function updatePosition() {
      const target = document.querySelector(step?.selector)
      if (!target) {
        setTargetRect(null)
        return
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)

        const tooltipH = tooltipRef.current?.offsetHeight || 200
        let top = rect.bottom + gap
        let left = rect.left + rect.width / 2 - width / 2

        if (top + tooltipH > window.innerHeight - padding) top = rect.top - tooltipH - gap
        if (top < padding) top = padding
        if (left < padding) left = padding
        if (left + width > window.innerWidth - padding) left = window.innerWidth - width - padding

        setPos({ top, left })
      }, 220)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [step])

  if (!step || !targetRect) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }} aria-hidden="true">
        <svg width="100%" height="100%">
          <defs>
            <mask id="tour-highlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 10}
                y={targetRect.top - 10}
                width={targetRect.width + 20}
                height={targetRect.height + 20}
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#tour-highlight-mask)" />
          <rect
            x={targetRect.left - 10}
            y={targetRect.top - 10}
            width={targetRect.width + 20}
            height={targetRect.height + 20}
            rx="10"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
        </svg>
      </div>

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="false"
        aria-label={step.title}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          width: 'min(92vw, 340px)',
          maxWidth: 'calc(100vw - 24px)',
        }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-4 animate-fade-in"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
              {index + 1}
            </span>
            <p className="font-sans font-bold text-sm text-card-foreground leading-snug">{step.title}</p>
          </div>
          <button onClick={onStop} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5" aria-label="Fechar tour">
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-2 leading-relaxed pl-7">{step.body}</p>

        {step.tip && (
          <div className="ml-7 mb-3 flex items-start gap-1.5 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2">
            <Lightbulb size={12} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary font-body leading-relaxed">{step.tip}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pl-7">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full transition-all shrink-0 ${
                  i === index ? 'w-4 h-1.5 bg-primary' : i < index ? 'w-1.5 h-1.5 bg-primary/40' : 'w-1.5 h-1.5 bg-border'
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground font-body">{index + 1}/{total}</span>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={onStop} className="text-[11px] text-muted-foreground hover:text-foreground font-body underline underline-offset-2 transition-colors">
              Pular tour
            </button>
            <div className="flex gap-2">
              {index > 0 && (
                <button onClick={onPrev} className="flex items-center gap-1 text-xs border border-border px-2.5 py-1.5 rounded-lg font-body hover:bg-muted transition-colors">
                  <ChevronLeft size={12} /> Anterior
                </button>
              )}
              <button onClick={onNext} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg font-body hover:opacity-90 transition-opacity">
                {isLast ? <><CheckCircle2 size={12} /> Concluir</> : <>Próximo <ChevronRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
