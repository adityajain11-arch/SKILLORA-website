import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  const colors = ['#7C6CF0', '#FF8A65', '#34D399', '#A99CFF', '#FFA07A'];

  // Warm gentle burst
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.65 },
    colors: colors,
    ticks: 200,
    gravity: 0.9,
    scalar: 0.9,
    shapes: ['circle', 'square']
  });

  // Second gentle side flutter
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0.2, y: 0.7 },
      colors: colors,
      scalar: 0.8
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 0.8, y: 0.7 },
      colors: colors,
      scalar: 0.8
    });
  }, 150);
}
