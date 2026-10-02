import type { PathCommand } from "../../../ports/outbound/font.port.ts";

interface Point {
  x: number;
  y: number;
}

interface Edge {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dir: number;
}

interface Crossing {
  x: number;
  dir: number;
}

export type PointTransform = (x: number, y: number) => Point;

/** Vertical samples per pixel; horizontal coverage is computed analytically. */
const SUBSAMPLES = 4;
const QUADRATIC_STEPS = 8;
const CUBIC_STEPS = 12;

function flattenQuadratic(from: Point, control: Point, to: Point, steps: number, out: Point[]): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
      y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y,
    });
  }
}

function flattenCubic(
  from: Point,
  control1: Point,
  control2: Point,
  to: Point,
  steps: number,
  out: Point[]
): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const a = mt * mt * mt;
    const b = 3 * mt * mt * t;
    const c = 3 * mt * t * t;
    const d = t * t * t;
    out.push({
      x: a * from.x + b * control1.x + c * control2.x + d * to.x,
      y: a * from.y + b * control1.y + c * control2.y + d * to.y,
    });
  }
}

function buildSubpaths(commands: readonly PathCommand[], transform: PointTransform): Point[][] {
  const subpaths: Point[][] = [];
  let current: Point[] = [];
  let cursor: Point = { x: 0, y: 0 };

  const closeCurrent = (): void => {
    if (current.length === 0) return;
    const first = current[0];
    const last = current[current.length - 1];
    if (first.x !== last.x || first.y !== last.y) {
      current.push(first);
    }
    subpaths.push(current);
    current = [];
  };

  for (const command of commands) {
    switch (command.type) {
      case "M":
        closeCurrent();
        cursor = transform(command.x, command.y);
        current.push(cursor);
        break;
      case "L":
        cursor = transform(command.x, command.y);
        current.push(cursor);
        break;
      case "Q": {
        const control = transform(command.cx, command.cy);
        const to = transform(command.x, command.y);
        flattenQuadratic(cursor, control, to, QUADRATIC_STEPS, current);
        cursor = to;
        break;
      }
      case "C": {
        const control1 = transform(command.c1x, command.c1y);
        const control2 = transform(command.c2x, command.c2y);
        const to = transform(command.x, command.y);
        flattenCubic(cursor, control1, control2, to, CUBIC_STEPS, current);
        cursor = to;
        break;
      }
      case "Z":
        closeCurrent();
        break;
      default:
        break;
    }
  }

  closeCurrent();
  return subpaths;
}

function buildEdges(subpaths: readonly Point[][]): Edge[] {
  const edges: Edge[] = [];

  for (const points of subpaths) {
    for (let i = 0; i + 1 < points.length; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (a.y === b.y) continue;

      if (a.y < b.y) {
        edges.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, dir: 1 });
      } else {
        edges.push({ x0: b.x, y0: b.y, x1: a.x, y1: a.y, dir: -1 });
      }
    }
  }

  return edges;
}

function addSpan(
  coverage: Float32Array,
  width: number,
  row: number,
  spanStart: number,
  spanEnd: number,
  weight: number
): void {
  const start = Math.max(0, spanStart);
  const end = Math.min(width, spanEnd);
  if (end <= start) return;

  const rowOffset = row * width;
  let pixel = Math.floor(start);
  let x = start;

  while (x < end && pixel < width) {
    const boundary = Math.min(pixel + 1, end);
    coverage[rowOffset + pixel] += (boundary - x) * weight;
    x = boundary;
    pixel++;
  }
}

/**
 * Fills glyph outlines into a coverage buffer using the non-zero winding rule.
 * Anti-aliasing comes from vertical supersampling plus exact horizontal
 * span/pixel overlap.
 */
export function fillPath(
  commands: readonly PathCommand[],
  width: number,
  height: number,
  coverage: Float32Array,
  transform: PointTransform
): void {
  const edges = buildEdges(buildSubpaths(commands, transform));
  if (edges.length === 0) return;

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const edge of edges) {
    if (edge.y0 < minY) minY = edge.y0;
    if (edge.y1 > maxY) maxY = edge.y1;
  }

  const firstRow = Math.max(0, Math.floor(minY));
  const lastRow = Math.min(height - 1, Math.ceil(maxY));
  if (firstRow > lastRow) return;

  const crossings: Crossing[] = [];
  const weight = 1 / SUBSAMPLES;

  for (let row = firstRow; row <= lastRow; row++) {
    for (let sample = 0; sample < SUBSAMPLES; sample++) {
      const sampleY = row + (sample + 0.5) / SUBSAMPLES;
      crossings.length = 0;

      for (const edge of edges) {
        if (sampleY < edge.y0 || sampleY >= edge.y1) continue;
        const ratio = (sampleY - edge.y0) / (edge.y1 - edge.y0);
        crossings.push({ x: edge.x0 + ratio * (edge.x1 - edge.x0), dir: edge.dir });
      }

      if (crossings.length < 2) continue;
      crossings.sort((a, b) => a.x - b.x);

      let winding = 0;
      for (let i = 0; i < crossings.length - 1; i++) {
        winding += crossings[i].dir;
        if (winding === 0) continue;
        addSpan(coverage, width, row, crossings[i].x, crossings[i + 1].x, weight);
      }
    }
  }
}
