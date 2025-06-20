'use client'

import { useEffect, useRef } from 'react'

export function MatrixBackground() {
  console.log('MatrixBackground rendering')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    console.log('MatrixBackground effect starting')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas ref is null')
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      console.error('Could not get canvas context')
      return
    }

    console.log('Canvas setup successful')
    const chars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789'.split('')
    const fontSize = 20
    let drops: number[] = []
    let animationFrame: number

    const setCanvasSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height
      drops = Array(Math.ceil(width / fontSize)).fill(1)
      console.log(`Canvas resized to ${width}x${height}`)
    }

    const draw = () => {
      context.fillStyle = 'rgba(0, 0, 0, 0.32)'
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Configure text style
      context.font = `${fontSize}px monospace`
      context.textAlign = 'center'

      drops.forEach((drop, i) => {
        const x = (i * fontSize) + (fontSize / 2)
        
        // Draw bright head character
        const char = chars[Math.floor(Math.random() * chars.length)]
        context.fillStyle = 'rgba(255, 255, 255, 0.58)' // More transparent white
        context.fillText(char, x, drop * fontSize)

        // Draw trailing characters
        for (let j = 1; j < 15; j++) {
          if (drop - j > 0) {
            const trailChar = chars[Math.floor(Math.random() * chars.length)]
            const opacity = (15 - j) / 15 * 0.3 // More transparent trails
            context.fillStyle = `rgba(0, 255, 70, ${opacity})`
            context.fillText(trailChar, x, (drop - j) * fontSize)
          }
        }

        // Reset or update drop position
        if (drop * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0
        } else {
          drops[i] += 0.15 // Slower fall speed (was 0.5)
        }
      })

      animationFrame = requestAnimationFrame(draw)
    }

    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
    draw()

    return () => {
      console.log('MatrixBackground cleanup')
      window.removeEventListener('resize', setCanvasSize)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: 0.6, // Overall more transparent
          background: '#000',
        }}
      />
    </div>
  )
} 