import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  const colors = ['#7C6CF0', '#FF8A65', '#34D399', '#A99CFF', '#F2CB80'];

  // Primary celebratory burst rendered above modals
  confetti({
    particleCount: 65,
    spread: 72,
    origin: { y: 0.62 },
    colors,
    ticks: 220,
    gravity: 0.9,
    scalar: 0.95,
    shapes: ['circle', 'square'],
    zIndex: 9999,
    disableForReducedMotion: true,
  });

  // Secondary side cannons
  window.setTimeout(() => {
    confetti({
      particleCount: 36,
      angle: 60,
      spread: 58,
      origin: { x: 0.18, y: 0.68 },
      colors,
      scalar: 0.85,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 36,
      angle: 120,
      spread: 58,
      origin: { x: 0.82, y: 0.68 },
      colors,
      scalar: 0.85,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  }, 160);
}
