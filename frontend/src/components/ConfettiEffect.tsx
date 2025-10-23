import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

/**
 * ConfettiEffect - Pure CSS/Framer Motion confetti celebration
 * Triggers when a transaction is accepted
 */
export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!showConfetti) return null;

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomX = Math.random() * 100;
    const randomRotate = Math.random() * 720 - 360;
    const randomDelay = Math.random() * 0.5;
    const randomDuration = 2 + Math.random() * 1;

    return (
      <motion.div
        key={i}
        initial={{ 
          x: '50%', 
          y: '-10%',
          rotate: 0,
          opacity: 1,
          scale: 0.5
        }}
        animate={{ 
          x: `${randomX}%`,
          y: '120%',
          rotate: randomRotate,
          opacity: 0,
          scale: 1
        }}
        transition={{ 
          duration: randomDuration,
          delay: randomDelay,
          ease: 'easeOut'
        }}
        className="absolute top-0 w-3 h-3 pointer-events-none"
        style={{
          backgroundColor: randomColor,
          boxShadow: `0 0 10px ${randomColor}`,
        }}
      />
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confettiPieces}
      </div>
    </AnimatePresence>
  );
};

