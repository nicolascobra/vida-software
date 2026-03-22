import { useRef } from 'react'
import { motion } from 'framer-motion'

const spring = { type: 'spring', stiffness: 460, damping: 28 }

export default function DateRangeSlider({
  filterStart, filterEnd, setFilterStart, setFilterEnd,
  accentColor = '#0a0a0a',
}) {
  const trackRef = useRef(null)
  const hoje     = new Date()
  const minTs    = new Date(hoje.getFullYear(), 0, 1).getTime()
  const maxTs    = new Date(hoje.getFullYear(), 11, 31).getTime()

  const startTs = new Date(filterStart + 'T12:00:00').getTime()
  const endTs   = new Date(filterEnd   + 'T12:00:00').getTime()

  const toPercent = ts  => Math.max(0, Math.min(100, (ts - minTs) / (maxTs - minTs) * 100))
  const fromPct   = pct => new Date(Math.round(minTs + (pct / 100) * (maxTs - minTs)))
  const toDateStr = d   => d.toISOString().split('T')[0]

  const startPct = toPercent(startTs)
  const endPct   = toPercent(endTs)

  function getPct(e) {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100))
  }

  function makeHandlers(which) {
    return {
      onPointerDown(e) {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
      },
      onPointerMove(e) {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const dateStr = toDateStr(fromPct(getPct(e)))
        if (which === 'start' && dateStr < filterEnd)   setFilterStart(dateStr)
        if (which === 'end'   && dateStr > filterStart) setFilterEnd(dateStr)
      },
      onPointerUp(e) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      },
    }
  }

  function fmtLabel(str) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
      {/* Track */}
      <div
        ref={trackRef}
        style={{ position: 'relative', height: 3, background: 'rgba(0,0,0,0.10)', borderRadius: 99, margin: '0 8px' }}
      >
        {/* Fill */}
        <div style={{
          position: 'absolute', height: '100%', borderRadius: 99,
          left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%`,
          background: accentColor,
        }} />

        {/* Start handle — posicionador fixo + visual separado */}
        <div
          {...makeHandlers('start')}
          style={{
            position: 'absolute', width: 18, height: 18,
            top: '50%', left: `${startPct}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'grab', touchAction: 'none', zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.88 }}
            transition={spring}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              background: '#fff', border: `2.5px solid ${accentColor}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* End handle */}
        <div
          {...makeHandlers('end')}
          style={{
            position: 'absolute', width: 18, height: 18,
            top: '50%', left: `${endPct}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'grab', touchAction: 'none', zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.88 }}
            transition={spring}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              background: '#fff', border: `2.5px solid ${accentColor}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px 0' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,0.38)' }}>{fmtLabel(filterStart)}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,0.38)' }}>{fmtLabel(filterEnd)}</span>
      </div>
    </div>
  )
}
