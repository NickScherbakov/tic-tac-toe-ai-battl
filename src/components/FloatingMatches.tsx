import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const PARTICLE_COUNT = 12;

export function FloatingMatches() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const created: Particle[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 10,
      delay: Math.random() * 6,
      duration: 12 + Math.random() * 10,
    }));
    setParticles(created);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 0.5, 0.4, 0.6, 0],
            y: [p.y + '%', (p.y - 15) + '%', (p.y - 30) + '%'],
            rotate: [0, 25, -15, 10],
          }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            delay: p.delay,
            duration: p.duration,
          }}
          style={{
            position: 'absolute',
            left: p.x + '%',
            top: p.y + '%',
            fontSize: p.size,
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.25))',
          }}
        >
          🪵
        </motion.span>
      ))}
    </div>
  );
}