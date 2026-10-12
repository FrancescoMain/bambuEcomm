import { Bat } from "./art";

const BATS = [
  { size: "w-12", tone: "text-[#1b0f2e]/80", delay: "2s", top: "18%" },
  { size: "w-8", tone: "text-[#1b0f2e]/60", delay: "11s", top: "42%" },
  { size: "w-10", tone: "text-[#1b0f2e]/70", delay: "19s", top: "28%" },
];

/**
 * Pipistrelli che attraversano lo schermo ogni tanto: solo CSS, non bloccano i clic
 * e spariscono con "riduci movimento" attivo.
 */
export function HalloweenBats() {
  return (
    <div aria-hidden className="halloween-bats pointer-events-none fixed inset-0 z-[35] overflow-hidden">
      {BATS.map((b) => (
        <span
          key={b.delay}
          className="halloween-bat"
          style={{ "--bat-delay": b.delay, "--bat-top": b.top } as React.CSSProperties}
        >
          <Bat className={`halloween-flap block ${b.size} ${b.tone}`} />
        </span>
      ))}
    </div>
  );
}
