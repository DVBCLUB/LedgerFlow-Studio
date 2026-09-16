/**
 * gamePhysicsEngine.ts - Advanced 2D Physics Simulator
 */

export interface Vector2 { x: number; y: number; }
export interface PhysicsBody { id: string; position: Vector2; velocity: Vector2; acceleration: Vector2; width: number; height: number; mass: number; isStatic: boolean; restitution: number; friction: number; tags: string[]; }
export interface AABB { x: number; y: number; width: number; height: number; }
export interface CollisionResult { overlap: boolean; penetrationX: number; penetrationY: number; normal: Vector2; }

export function vec2(x: number, y: number): Vector2 { return { x, y }; }
export function vecAdd(a: Vector2, b: Vector2): Vector2 { return { x: a.x + b.x, y: a.y + b.y }; }
export function vecSub(a: Vector2, b: Vector2): Vector2 { return { x: a.x - b.x, y: a.y - b.y }; }
export function vecLength(v: Vector2): number { return Math.sqrt(v.x * v.x + v.y * v.y); }
export function vecScale(v: Vector2, s: number): Vector2 { return { x: v.x * s, y: v.y * s }; }

export function aabbFromBody(body: PhysicsBody): AABB {
  return { x: body.position.x - body.width / 2, y: body.position.y - body.height / 2, width: body.width, height: body.height };
}
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createPhysicsBody(params: any): PhysicsBody {
  return { id: params.id, position: params.position || { x: 0, y: 0 }, velocity: params.velocity || { x: 0, y: 0 },
    acceleration: params.acceleration || { x: 0, y: 0 }, width: params.width || 32, height: params.height || 32,
    mass: params.mass || 1, isStatic: params.isStatic || false, restitution: params.restitution ?? 0.5,
    friction: params.friction ?? 0.1, tags: params.tags || [] };
}

export function updatePhysicsBody(body: PhysicsBody, dt: number, gravity?: number): void {
  if (body.isStatic) return;
  body.velocity.x += body.acceleration.x * dt;
  body.velocity.y += (body.acceleration.y + (gravity || 0)) * dt;
  body.velocity.x *= (1 - body.friction * dt);
  if (Math.abs(body.velocity.x) < 0.01) body.velocity.x = 0;
  body.position.x += body.velocity.x * dt;
  body.position.y += body.velocity.y * dt;
}

export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, PhysicsBody[]>;
  constructor(cellSize = 64) { this.cellSize = cellSize; this.cells = new Map(); }
  insert(body: PhysicsBody): void {
    const aabb = aabbFromBody(body);
    const minX = Math.floor(aabb.x / this.cellSize);
    const maxX = Math.floor((aabb.x + aabb.width) / this.cellSize);
    const minY = Math.floor(aabb.y / this.cellSize);
    const maxY = Math.floor((aabb.y + aabb.height) / this.cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = cx + "," + cy;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        cell.push(body);
      }
    }
  }
  clear(): void { this.cells.clear(); }
  getNearby(body: PhysicsBody): PhysicsBody[] {
    const aabb = aabbFromBody(body);
    const minX = Math.floor(aabb.x / this.cellSize);
    const maxX = Math.floor((aabb.x + aabb.width) / this.cellSize);
    const minY = Math.floor(aabb.y / this.cellSize);
    const maxY = Math.floor((aabb.y + aabb.height) / this.cellSize);
    const nearby = new Set<PhysicsBody>();
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = cx + "," + cy;
        const cell = this.cells.get(key);
        if (cell) { for (const b of cell) { if (b !== body) nearby.add(b); } }
      }
    }
    return Array.from(nearby);
  }
  get cellCount(): number { return this.cells.size; }
}

export function generateGameLoopCode(p: PhysicsBody, obstacles: PhysicsBody[], cw = 800, ch = 480): string {
  const obsData = obstacles.map(o => ({ x: o.position.x, y: o.position.y, w: o.width, h: o.height }));
  const code = [
    'const canvas = document.getElementById("gameCanvas");',
    'const ctx = canvas.getContext("2d");',
    'canvas.width = ' + cw + ';',
    'canvas.height = ' + ch + ';',
    'let player = { x: ' + p.position.x + ', y: ' + p.position.y + ', w: ' + p.width + ', h: ' + p.height + ' };',
    'let score = 0; let lives = 3; let keys = {}; let particles = [];',
    'const obstacles = ' + JSON.stringify(obsData) + ';',
    'document.addEventListener("keydown", e => keys[e.key] = true);',
    'document.addEventListener("keyup", e => keys[e.key] = false);',
    'function update(dt) {',
    '  if (keys["ArrowLeft"] || keys["a"]) player.x -= 200 * dt;',
    '  if (keys["ArrowRight"] || keys["d"]) player.x += 200 * dt;',
    '  if (keys["ArrowUp"] || keys["w"]) player.y -= 200 * dt;',
    '  if (keys["ArrowDown"] || keys["s"]) player.y += 200 * dt;',
    '  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));',
    '  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));',
    '  for (const obs of obstacles) {',
    '    if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&',
    '        player.y < obs.y + obs.h && player.y + player.h > obs.y) {',
    '      score += 10;',
    '      obs.x = Math.random() * (canvas.width - obs.w);',
    '      obs.y = Math.random() * (canvas.height - obs.h);',
    '    }',
    '  }',
    '  if (Math.random() < 0.3) {',
    '    particles.push({ x: player.x + player.w/2, y: player.y + player.h/2, vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, life: 1 });',
    '  }',
    '  for (let i = particles.length - 1; i >= 0; i--) {',
    '    particles[i].x += particles[i].vx * dt;',
    '    particles[i].y += particles[i].vy * dt;',
    '    particles[i].life -= dt;',
    '    if (particles[i].life <= 0) particles.splice(i, 1);',
    '  }',
    '}',
    'function draw() {',
    '  ctx.fillStyle = "#0b0f19";',
    '  ctx.fillRect(0, 0, canvas.width, canvas.height);',
    '  for (const obs of obstacles) {',
    '    ctx.fillStyle = "#06b6d4"; ctx.shadowColor = "#06b6d4"; ctx.shadowBlur = 10;',
    '    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);',
    '    ctx.shadowBlur = 0;',
    '  }',
    '  ctx.fillStyle = "#3b82f6"; ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 15;',
    '  ctx.fillRect(player.x, player.y, player.w, player.h);',
    '  ctx.shadowBlur = 0;',
    '  for (const p of particles) {',
    '    ctx.fillStyle = "rgba(255, 100, 50, " + p.life + ")";',
    '    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();',
    '  }',
    '  ctx.fillStyle = "#f8fafc"; ctx.font = "16px system-ui";',
    '  ctx.fillText("Score: " + score, 16, 24);',
    '  ctx.fillText("Lives: " + lives, canvas.width - 100, 24);',
    '}',
    'let lastTime = 0;',
    'function gameLoop(time) { const dt = Math.min((time - lastTime) / 1000, 0.05);',
    '  lastTime = time; update(dt); draw(); requestAnimationFrame(gameLoop);',
    '}',
    'requestAnimationFrame(gameLoop);',
  ];
  return code.join("\n");
}