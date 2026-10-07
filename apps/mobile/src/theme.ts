import type { ProjectStatus, TaskPriority, TaskStatus } from '@pms/shared';

/**
 * Mobile design tokens — mirror of apps/web/src/styles/tokens.css (Flecto visual language).
 * Components must use these values only; no literal colours or radii in screens.
 */
const palette = {
  forestInk: '#004737',
  forestInkStrong: '#003629',
  mintPulse: '#56f09f',
  mintMist: '#d4ffe8',
  creamCanvas: '#fffbec',
  deepLoam: '#032019',
  sageWhisper: '#99b5af',
  stoneMist: '#ccdad7',
  bone: '#faf2d5',
  paper: '#ffffff',
  moss: '#48655e',
  clay: '#a83a22',
  clayMist: '#fbe4da',
  amber: '#8a5a00',
  amberMist: '#fff1c7',
};

/** Semantic colours (names kept stable for existing components). */
export const colors = {
  brand: palette.forestInk, // structural surfaces, active states, links
  brandDark: palette.forestInkStrong,
  brandSoft: palette.mintMist,
  accent: palette.mintPulse, // primary CTA fill
  onAccent: palette.deepLoam,
  bg: palette.creamCanvas,
  card: palette.paper,
  cardWarm: palette.bone,
  border: palette.stoneMist,
  text: palette.deepLoam,
  muted: palette.moss,
  faint: palette.sageWhisper,
  danger: palette.clay,
  dangerSoft: palette.clayMist,
  warning: palette.amber,
  warningSoft: palette.amberMist,
  success: palette.forestInk,
  onBrand: palette.creamCanvas,
};

export const statusColors: Record<ProjectStatus | TaskStatus, { bg: string; fg: string }> = {
  NOT_STARTED: { bg: palette.paper, fg: palette.moss },
  PENDING: { bg: palette.bone, fg: palette.deepLoam },
  IN_PROGRESS: { bg: palette.forestInk, fg: palette.creamCanvas },
  COMPLETED: { bg: palette.mintMist, fg: palette.forestInk },
};

export const priorityColors: Record<TaskPriority, { bg: string; fg: string }> = {
  LOW: { bg: palette.paper, fg: palette.moss },
  MEDIUM: { bg: palette.bone, fg: palette.deepLoam },
  HIGH: { bg: palette.clayMist, fg: palette.clay },
};

/** Card / input radius (web: --radius-card). Buttons and chips are fully rounded. */
export const radius = 19;
export const buttonRadius = 40;
