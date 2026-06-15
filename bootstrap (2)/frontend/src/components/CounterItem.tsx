import React, { useEffect, useState } from 'react';

interface CounterItemProps {
  target: number;
}

export const CounterItem: React.FC<CounterItemProps> = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2200;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="hero-stat-number">
      {count}
      {target > 50 ? '+' : ''}
    </div>
  );
};
