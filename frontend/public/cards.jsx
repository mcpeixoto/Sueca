// ============================================================
// FLYING CARDS ANIMATION LAYER
// Background ambient cards + celebratory bursts
// ============================================================

const SUITS = [
  { s: "♠", c: "#0a0a0a" },
  { s: "♥", c: "#a8321f" },
  { s: "♦", c: "#a8321f" },
  { s: "♣", c: "#0a0a0a" },
];
const RANKS = ["A","2","3","4","5","6","7","Q","J","K"];

function Card({ suit, rank, style, size = 64 }) {
  const color = suit.c;
  return (
    <div
      className="sueca-card"
      style={{
        width: size,
        height: size * 1.4,
        background: "linear-gradient(145deg, #faf4e3 0%, #f1e2bf 100%)",
        borderRadius: size * 0.09,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.08)",
        position: "relative",
        color,
        fontFamily: "'Playfair Display', serif",
        ...style,
      }}
    >
      <div style={{position:"absolute", top: size*0.08, left: size*0.12, fontSize: size*0.28, lineHeight:1, fontWeight:700}}>
        {rank}
      </div>
      <div style={{position:"absolute", top: size*0.38, left: size*0.12, fontSize: size*0.28, lineHeight:1}}>
        {suit.s}
      </div>
      <div style={{position:"absolute", bottom: size*0.08, right: size*0.12, fontSize: size*0.28, lineHeight:1, fontWeight:700, transform:"rotate(180deg)"}}>
        {rank}
      </div>
      <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize: size*0.7, opacity:0.92, lineHeight:1}}>
        {suit.s}
      </div>
    </div>
  );
}

// Ambient drifting cards in the background
function AmbientCards({ count = 6 }) {
  const cards = React.useMemo(() => {
    return Array.from({length: count}).map((_, i) => ({
      suit: SUITS[i % 4],
      rank: RANKS[(i * 3) % RANKS.length],
      left: (i * 17 + 8) % 100,
      top: (i * 23 + 12) % 100,
      delay: i * 1.7,
      duration: 22 + (i % 4) * 4,
      rotate: (i * 37) % 360,
      size: 54 + (i % 3) * 18,
      opacity: 0.06 + (i % 3) * 0.02,
    }));
  }, [count]);
  return (
    <div style={{position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex: 0}}>
      {cards.map((c, i) => (
        <div key={i}
          style={{
            position:"absolute",
            left: `${c.left}%`, top: `${c.top}%`,
            animation: `drift${i%3} ${c.duration}s ease-in-out ${c.delay}s infinite alternate`,
            opacity: c.opacity,
            transform: `rotate(${c.rotate}deg)`,
          }}
        >
          <Card suit={c.suit} rank={c.rank} size={c.size} />
        </div>
      ))}
    </div>
  );
}

// Card burst (used when a winner is declared)
function CardBurst({ trigger }) {
  const [burst, setBurst] = React.useState(null);
  React.useEffect(() => {
    if (!trigger) return;
    const id = Math.random();
    setBurst({ id, cards: Array.from({length: 32}).map((_, i) => ({
      suit: SUITS[i % 4],
      rank: RANKS[i % RANKS.length],
      angle: (Math.PI * 2 * i) / 32 + Math.random()*0.3,
      distance: 400 + Math.random()*400,
      rotate: Math.random()*720 - 360,
      delay: Math.random()*0.2,
      duration: 1.8 + Math.random()*1.2,
    }))});
    const t = setTimeout(() => setBurst(null), 3500);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!burst) return null;
  return (
    <div style={{position:"fixed", inset:0, pointerEvents:"none", zIndex: 40}}>
      {burst.cards.map((c, i) => {
        const tx = Math.cos(c.angle) * c.distance;
        const ty = Math.sin(c.angle) * c.distance;
        return (
          <div key={i}
            style={{
              position:"absolute",
              left:"50%", top:"50%",
              animation: `burst-${burst.id.toString(36).slice(2)} ${c.duration}s cubic-bezier(.2,.7,.3,1) ${c.delay}s forwards`,
              ["--tx"]: `${tx}px`, ["--ty"]: `${ty}px`, ["--rot"]: `${c.rotate}deg`,
            }}
          >
            <style>{`
              @keyframes burst-${burst.id.toString(36).slice(2)} {
                0% { transform: translate(-50%,-50%) scale(0.3) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--rot)); opacity: 0; }
              }
            `}</style>
            <Card suit={c.suit} rank={c.rank} size={70} />
          </div>
        );
      })}
    </div>
  );
}

// Dealing cards animation (used for transitions between projector views)
function DealingCards({ playing }) {
  if (!playing) return null;
  return (
    <div style={{position:"fixed", inset:0, pointerEvents:"none", zIndex: 30, overflow:"hidden"}}>
      {Array.from({length: 8}).map((_, i) => (
        <div key={i}
          style={{
            position:"absolute",
            left: "50%", top:"-20%",
            animation: `deal-${i} 0.9s cubic-bezier(.3,.7,.3,1) ${i*0.04}s forwards`,
          }}
        >
          <style>{`
            @keyframes deal-${i} {
              0% { transform: translate(-50%, 0) rotate(0deg); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translate(calc(-50% + ${(i-3.5)*180}px), 140vh) rotate(${(i-3.5)*60}deg); opacity: 0; }
            }
          `}</style>
          <Card suit={SUITS[i%4]} rank={RANKS[i%RANKS.length]} size={80} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Card, AmbientCards, CardBurst, DealingCards, SUITS, RANKS });
