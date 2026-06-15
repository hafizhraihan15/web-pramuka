import React, { useEffect, useState } from 'react';

export const TypingEffect: React.FC = () => {
  const texts = [
    'Membentuk generasi berkarakter...',
    'Berlatih, Berprestasi, Berbakti...',
    'Pramuka: Petualangan sejati!',
    'Bersama membangun negeri...',
    'Sedia — Waspada — Kesatria 🏕️',
  ];

  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let timer: any;
    const currentText = texts[textIndex];

    const tick = () => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);

        if (charIndex + 1 === currentText.length) {
          timer = setTimeout(() => {
            setIsDeleting(true);
          }, 2200);
          return;
        }
      } else {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);

        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setCharIndex(0);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }

      const speed = isDeleting ? 38 : 78;
      timer = setTimeout(tick, speed);
    };

    timer = setTimeout(tick, isDeleting ? 38 : 78);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <p className="hero-typing" id="typing-text" style={{ fontSize: '1.2rem', color: '#ffd700', minHeight: '1.8rem', margin: '10px 0 25px 0' }}>
      <span>{displayText}</span>
      <span className="cursor" style={{ animation: 'blink 0.8s infinite' }}>|</span>
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </p>
  );
};
