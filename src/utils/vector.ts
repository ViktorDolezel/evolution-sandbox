export interface Vector2 {
  x: number;
  y: number;
}

export function create(x: number, y: number): Vector2 {
  return { x, y };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function multiply(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function divide(v: Vector2, scalar: number): Vector2 {
  return { x: v.x / scalar, y: v.y / scalar };
}

export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / mag, y: v.y / mag };
}

export function distance(a: Vector2, b: Vector2): number {
  return magnitude(subtract(a, b));
}

export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function clampMagnitude(v: Vector2, maxMagnitude: number): Vector2 {
  const mag = magnitude(v);
  if (mag === 0 || mag <= maxMagnitude) {
    return { x: v.x, y: v.y };
  }
  const scale = maxMagnitude / mag;
  return { x: v.x * scale, y: v.y * scale };
}

export function randomUnit(random: () => number): Vector2 {
  const angle = random() * Math.PI * 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

export const ZERO: Vector2 = { x: 0, y: 0 };
