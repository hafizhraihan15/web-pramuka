import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  opacity: string;
  dur: number;
  delay: string;
  glow: string;
}

export const TwinkleStars: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const STAR_COUNT = 200;
    const colors = [
      'rgba(255,255,255,',
      'rgba(255,215,0,',
      'rgba(255,235,100,',
      'rgba(180,220,255,',
    ];
    const blinkDurations = [1.2, 1.6, 2.0, 2.5, 3.0, 1.8, 0.9, 2.8];
    const generatedStars: Star[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Math.random() * 2.8 + 0.5; // 0.5 – 3.3px
      const x = Math.random() * 100; // 0–100%
      const y = Math.random() * 100; // 0–100%
      const color = colors[Math.floor(Math.random() * colors.length)];
      const opacity = (Math.random() * 0.5 + 0.4).toFixed(2); // 0.4–0.9
      const dur = blinkDurations[Math.floor(Math.random() * blinkDurations.length)];
      const delay = (Math.random() * 5).toFixed(2); // 0–5s stagger
      const glow = Math.random() > 0.75
        ? `0 0 ${(size * 3).toFixed(1)}px ${color}0.85), 0 0 ${(size * 6).toFixed(1)}px ${color}0.35)`
        : 'none';

      generatedStars.push({
        id: i,
        size,
        x,
        y,
        color,
        opacity,
        dur,
        delay,
        glow
      });
    }

    setStars(generatedStars);
  }, []);

  return (
    <div id="twinkle-stars" style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.map((star) => (
        <span
          key={star.id}
          className="twinkle-star"
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: `${star.color}${star.opacity})`,
            boxShadow: star.glow,
            animation: `twinkle-blink ${star.dur}s ease-in-out ${star.delay}s infinite alternate`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle-blink {
          0%   { opacity: 0.08; transform: scale(0.6); }
          40%  { opacity: 1;    transform: scale(1.15); }
          70%  { opacity: 0.6;  transform: scale(0.9); }
          100% { opacity: 0.08; transform: scale(0.65); }
        }
      `}</style>
    </div>
  );
};
