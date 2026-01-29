import { useEffect, useState } from 'react';

interface SuccessCelebrationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export function SuccessCelebration({ 
  show, 
  message = 'Success!', 
  duration = 3000,
  onComplete 
}: SuccessCelebrationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generate random particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // Random position between -50% and 50%
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onComplete?.();
        }, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!show) return <></>;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className={`relative transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}>
        {/* Success Message */}
        <div className="relative bg-gradient-to-r from-[var(--focule-primary)] to-[var(--focule-accent)] text-white px-8 py-4 rounded-2xl shadow-2xl animate-glow">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {/* Ring animation */}
              <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
            </div>
            <span className="text-lg font-semibold">{message}</span>
          </div>
        </div>

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{
              animation: `particle-fly 1s ease-out ${particle.delay}s forwards`,
              transform: `translate(${particle.x}px, ${particle.y}px)`
            }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-[var(--focule-primary)] to-[var(--focule-accent)] rounded-full" />
          </div>
        ))}

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-4 animate-confetti-fall"
              style={{
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 0.1}s`,
                backgroundColor: i % 2 === 0 ? 'var(--focule-primary)' : 'var(--focule-accent)',
                animation: `confetti-fall 1.5s ease-in-out ${i * 0.1}s forwards`
              }}
            />
          ))}
        </div>
      </div>

      {/* Add custom styles */}
      <style>{`
        @keyframes particle-fly {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(1);
            opacity: 0;
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Simple success toast for smaller celebrations
interface SuccessToastProps {
  show: boolean;
  message: string;
  duration?: number;
}

export function SuccessToast({ show, message, duration = 2000 }: SuccessToastProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!show) return <></>;

  return (
    <div className={`fixed bottom-6 right-6 transition-all duration-300 z-50 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    }`}>
      <div className="bg-[var(--focule-primary)]/20 border border-[var(--focule-primary)]/50 text-[var(--focule-primary)] px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    </div>
  );
}
