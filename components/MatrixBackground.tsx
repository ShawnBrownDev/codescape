'use client'

import { useEffect, useRef } from 'react'

export const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix code setup with authentic character set
    const fontSize = 24;
    const columns = Math.floor(canvas.width / (fontSize * 2));
    
    // Initialize drops with random starting positions
    const drops: number[] = new Array(columns).fill(0).map(() => 
      Math.floor(Math.random() * -100) // Start above viewport at random positions
    );
    
    // More authentic Matrix character set
    const katakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ';
    const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'; 
    const numbers = '012345678９';
    const chars = katakana + hiragana + numbers;
    
    const speed = 1.5;

    // Random delays for each column
    const delays: number[] = new Array(columns).fill(0).map(() => 
      Math.floor(Math.random() * 100)
    );

    // Use a thinner font weight for more authentic look
    ctx.font = `${fontSize}px "MS Gothic", monospace`;
    
    // Enable subpixel rendering for sharper text
    ctx.textRendering = 'optimizeLegibility';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drops.forEach((y, i) => {
        // Only update if past delay
        if (delays[i] > 0) {
          delays[i]--;
          return;
        }

        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * (fontSize * 2);
        
        // Slightly brighter green for better visibility
        ctx.fillStyle = 'rgba(0, 255, 70, 0.45)';
        ctx.fillText(text, x, y * fontSize);

        // Reset when reaching bottom with random delay
        if (y * fontSize > canvas.height) {
          drops[i] = 0;
          delays[i] = Math.floor(Math.random() * 50); // Random delay before next drop
        }
        drops[i] += speed;
      });

      setTimeout(() => {
        requestAnimationFrame(draw);
      }, 200);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: '#000',
          opacity: 0.35,
        }}
      />
    </div>
  );
}; 