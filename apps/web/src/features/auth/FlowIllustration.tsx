import clsx from 'clsx';
import { CheckSquare, FolderKanban, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

type Grow = 'x' | 'x-reverse' | 'y-up' | 'y-down' | 'pop' | 'rise';

/** One animated piece of the diagram; visible once the cycle reaches its `step`. */
function El({
  step,
  level,
  grow,
  delay = 0,
  children,
}: {
  step: number;
  level: number;
  grow: Grow;
  delay?: 0 | 1 | 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <g className={clsx('flow-el', level >= step && 'is-on')} data-grow={grow} data-delay={delay}>
      {children}
    </g>
  );
}

/* Geometry (viewBox units). Thick connectors (20) and chunky nodes echo the reference's
   "growing circuit"; every branch ends in an icon square and a mini card. */
const WIRE = 20;
const HUB = { x: 246, y: 156, size: 56 };
const AXIS_X = 264; // vertical wires run on this x
const ICON = 40;
const CARD_X = 376;
const CARD_W = 172;

/**
 * Decorative product story for the auth screens: Workspace → Projects → Tasks → Dashboard.
 * Purely presentational (aria-hidden); the caption next to it carries the meaning.
 */
export function FlowIllustration({ level, className }: { level: number; className?: string }) {
  return (
    <svg viewBox="0 0 560 380" className={clsx('h-auto w-full', className)} aria-hidden="true" focusable="false">
      {/* ---------- Root: the user's workspace ---------- */}
      <El step={0} level={level} grow="pop">
        <rect x="16" y="140" width="112" height="88" rx="18" className="fill-accent" />
        <text x="72" y="180" textAnchor="middle" className="fill-on-accent text-body">
          YOUR
        </text>
        <text x="72" y="199" textAnchor="middle" className="fill-on-accent text-body">
          WORKSPACE
        </text>
      </El>
      <El step={0} level={level} grow="x" delay={1}>
        <rect x="126" y={184 - WIRE / 2} width="124" height={WIRE} className="fill-accent" />
      </El>
      <El step={0} level={level} grow="pop" delay={2}>
        <rect x={HUB.x} y={HUB.y} width={HUB.size} height={HUB.size} rx="12" className="fill-accent" />
        <rect x={HUB.x + 14} y={HUB.y + 14} width="28" height="28" rx="6" className="fill-panel" />
      </El>

      {/* ---------- Step 1: projects (branch up) ---------- */}
      <El step={1} level={level} grow="y-up">
        <rect x={AXIS_X} y="86" width={WIRE} height={HUB.y - 86 + 2} className="fill-accent" />
      </El>
      <El step={1} level={level} grow="x" delay={1}>
        <rect x={AXIS_X} y="86" width={330 - AXIS_X} height={WIRE} className="fill-accent" />
      </El>
      <El step={1} level={level} grow="pop" delay={2}>
        <rect x="330" y="76" width={ICON} height={ICON} rx="8" className="fill-accent" />
        <FolderKanban x={340} y={86} width={20} height={20} className="text-on-accent" strokeWidth={1.75} />
      </El>
      <El step={1} level={level} grow="rise" delay={3}>
        <rect x={CARD_X} y="28" width={CARD_W} height="112" rx="16" className="fill-accent" />
        <text x={CARD_X + 16} y="56" className="fill-on-accent text-body">
          Website Redesign
        </text>
        <rect x={CARD_X + 16} y="68" width="78" height="20" rx="10" className="fill-panel" />
        <text x={CARD_X + 26} y="82" className="fill-on-panel text-caption">
          IN PROGRESS
        </text>
        <rect x={CARD_X + 16} y="104" width={CARD_W - 32} height="6" rx="3" className="fill-panel/20" />
        <rect x={CARD_X + 16} y="104" width={(CARD_W - 32) * 0.72} height="6" rx="3" className="fill-panel" />
        <text x={CARD_X + CARD_W - 16} y="128" textAnchor="end" className="fill-on-accent text-caption">
          72% complete
        </text>
      </El>

      {/* ---------- Step 2: tasks (branch down) ---------- */}
      <El step={2} level={level} grow="y-down">
        <rect x={AXIS_X} y={HUB.y + HUB.size - 2} width={WIRE} height={286 - (HUB.y + HUB.size) + 2} className="fill-accent" />
      </El>
      <El step={2} level={level} grow="x" delay={1}>
        <rect x={AXIS_X} y="266" width={330 - AXIS_X} height={WIRE} className="fill-accent" />
      </El>
      <El step={2} level={level} grow="pop" delay={2}>
        <rect x="330" y="256" width={ICON} height={ICON} rx="8" className="fill-accent" />
        <CheckSquare x={340} y={266} width={20} height={20} className="text-on-accent" strokeWidth={1.75} />
      </El>
      <El step={2} level={level} grow="rise" delay={3}>
        <rect x={CARD_X} y="236" width={CARD_W} height="100" rx="16" className="fill-accent" />
        <rect x={CARD_X + 16} y="254" width="16" height="16" rx="4" className="fill-panel" />
        <path
          d={`M${CARD_X + 20} 262 l3 3 l6 -7`}
          className="stroke-accent"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={CARD_X + 42} y="267" className="fill-on-accent text-body">
          Design homepage
        </text>
        <rect x={CARD_X + 16} y="284" width="44" height="20" rx="10" className="fill-panel" />
        <text x={CARD_X + 25} y="298" className="fill-on-panel text-caption">
          HIGH
        </text>
        <text x={CARD_X + 70} y="298" className="fill-on-accent text-caption">
          Due tomorrow
        </text>
        <text x={CARD_X + 16} y="324" className="fill-on-accent text-caption">
          Synced to Android
        </text>
      </El>

      {/* ---------- Step 3: dashboard (branch right) ---------- */}
      <El step={3} level={level} grow="x">
        <rect x={HUB.x + HUB.size - 2} y={184 - WIRE / 2} width={330 - (HUB.x + HUB.size) + 2} height={WIRE} className="fill-accent" />
      </El>
      <El step={3} level={level} grow="pop" delay={1}>
        <rect x="330" y="164" width={ICON} height={ICON} rx="8" className="fill-accent" />
        <LayoutDashboard x={340} y={174} width={20} height={20} className="text-on-accent" strokeWidth={1.75} />
      </El>
      <El step={3} level={level} grow="rise" delay={2}>
        <rect x={CARD_X} y="152" width={CARD_W} height="64" rx="16" className="fill-accent" />
        <text x={CARD_X + 16} y="178" className="fill-on-accent text-body">
          8 tasks · 3 done
        </text>
        {[10, 18, 13, 24].map((h, i) => (
          <rect key={i} x={CARD_X + 16 + i * 14} y={204 - h} width="8" height={h} rx="2" className="fill-panel" />
        ))}
        <text x={CARD_X + CARD_W - 16} y="202" textAnchor="end" className="fill-on-accent text-caption">
          live
        </text>
      </El>
    </svg>
  );
}
