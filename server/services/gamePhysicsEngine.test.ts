/**
 * gamePhysicsEngine.test.ts
 * ============================================================
 * Tests for 2D Physics Engine
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  vec2, vecAdd, vecSub, vecLength, vecScale,
  createPhysicsBody, updatePhysicsBody,
  aabbFromBody, aabbOverlap,
  SpatialHash,
} from './gamePhysicsEngine.ts';

test('gamePhysicsEngine - vec2 creates a vector', () => {
  const v = vec2(3, 4);
  assert.deepEqual(v, { x: 3, y: 4 });
});

test('gamePhysicsEngine - vecAdd adds two vectors', () => {
  const result = vecAdd(vec2(1, 2), vec2(3, 4));
  assert.deepEqual(result, { x: 4, y: 6 });
});

test('gamePhysicsEngine - vecSub subtracts two vectors', () => {
  const result = vecSub(vec2(5, 8), vec2(2, 3));
  assert.deepEqual(result, { x: 3, y: 5 });
});

test('gamePhysicsEngine - vecLength calculates magnitude', () => {
  const length = vecLength(vec2(3, 4));
  assert.equal(length, 5);
});

test('gamePhysicsEngine - vecScale scales a vector', () => {
  const result = vecScale(vec2(2, 3), 2);
  assert.deepEqual(result, { x: 4, y: 6 });
});

test('gamePhysicsEngine - createPhysicsBody creates body with defaults', () => {
  const body = createPhysicsBody({ id: 'test1' });
  assert.equal(body.id, 'test1');
  assert.deepEqual(body.position, { x: 0, y: 0 });
  assert.deepEqual(body.velocity, { x: 0, y: 0 });
  assert.equal(body.mass, 1);
  assert.equal(body.isStatic, false);
  assert.equal(body.restitution, 0.5);
  assert.equal(body.friction, 0.1);
  assert.deepEqual(body.tags, []);
});

test('gamePhysicsEngine - createPhysicsBody creates body with custom params', () => {
  const body = createPhysicsBody({
    id: 'player',
    position: { x: 100, y: 200 },
    width: 64, height: 128,
    mass: 2, isStatic: false,
    restitution: 0.8, friction: 0.05,
    tags: ['player', 'collidable'],
  });
  assert.equal(body.id, 'player');
  assert.deepEqual(body.position, { x: 100, y: 200 });
  assert.equal(body.width, 64);
  assert.equal(body.height, 128);
  assert.equal(body.mass, 2);
  assert.equal(body.restitution, 0.8);
  assert.equal(body.friction, 0.05);
  assert.deepEqual(body.tags, ['player', 'collidable']);
});

test('gamePhysicsEngine - updatePhysicsBody moves body with velocity', () => {
  const body = createPhysicsBody({
    id: 'moving',
    position: { x: 0, y: 0 },
    velocity: { x: 10, y: 0 },
    friction: 0,
  });
  updatePhysicsBody(body, 0.1);
  assert.ok(Math.abs(body.position.x - 1) < 0.01);
  assert.equal(body.position.y, 0);
});

test('gamePhysicsEngine - updatePhysicsBody applies gravity', () => {
  const body = createPhysicsBody({
    id: 'falling',
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
  });
  updatePhysicsBody(body, 0.1, 9.81);
  assert.ok(body.velocity.y > 0);
  assert.ok(body.position.y > 0);
});

test('gamePhysicsEngine - updatePhysicsBody does not move static bodies', () => {
  const body = createPhysicsBody({
    id: 'wall', position: { x: 100, y: 100 },
    isStatic: true, velocity: { x: 50, y: 50 },
  });
  updatePhysicsBody(body, 1, 9.81);
  assert.deepEqual(body.position, { x: 100, y: 100 });
  assert.deepEqual(body.velocity, { x: 50, y: 50 });
});

test('gamePhysicsEngine - updatePhysicsBody applies friction', () => {
  const body = createPhysicsBody({
    id: 'sliding', position: { x: 0, y: 0 },
    velocity: { x: 100, y: 0 }, friction: 0.5,
  });
  updatePhysicsBody(body, 0.1);
  assert.ok(body.velocity.x < 100);
  assert.ok(body.velocity.x > 90);
});

test('gamePhysicsEngine - aabbFromBody creates correct AABB', () => {
  const body = createPhysicsBody({
    id: 'box', position: { x: 50, y: 50 },
    width: 32, height: 32,
  });
  const aabb = aabbFromBody(body);
  assert.deepEqual(aabb, { x: 34, y: 34, width: 32, height: 32 });
});

test('gamePhysicsEngine - aabbOverlap detects overlapping boxes', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 5, y: 5, width: 10, height: 10 };
  assert.ok(aabbOverlap(a, b));
});

test('gamePhysicsEngine - aabbOverlap detects non-overlapping boxes', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 20, y: 20, width: 10, height: 10 };
  assert.equal(aabbOverlap(a, b), false);
});

test('gamePhysicsEngine - aabbOverlap detects edge-touching boxes', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 10, y: 0, width: 10, height: 10 };
  assert.equal(aabbOverlap(a, b), false);
});

test('gamePhysicsEngine - SpatialHash inserts and retrieves nearby bodies', () => {
  const hash = new SpatialHash(64);
  const bodyA = createPhysicsBody({
    id: 'a', position: { x: 50, y: 50 },
    width: 32, height: 32,
  });
  const bodyB = createPhysicsBody({
    id: 'b', position: { x: 55, y: 55 },
    width: 32, height: 32,
  });
  hash.insert(bodyA);
  hash.insert(bodyB);
  const nearby = hash.getNearby(bodyA);
  assert.ok(nearby.length > 0);
  assert.ok(nearby.some(b => b.id === 'b'));
});

test('gamePhysicsEngine - SpatialHash getNearby returns empty for far bodies', () => {
  const hash = new SpatialHash(64);
  const bodyA = createPhysicsBody({ id: 'a', position: { x: 10, y: 10 } });
  const bodyB = createPhysicsBody({ id: 'b', position: { x: 1000, y: 1000 } });
  hash.insert(bodyA);
  hash.insert(bodyB);
  const nearby = hash.getNearby(bodyA);
  assert.equal(nearby.length, 0);
});

test('gamePhysicsEngine - SpatialHash clear removes all bodies', () => {
  const hash = new SpatialHash(64);
  hash.insert(createPhysicsBody({ id: 'a', position: { x: 10, y: 10 } }));
  hash.insert(createPhysicsBody({ id: 'b', position: { x: 20, y: 20 } }));
  assert.ok(hash.cellCount > 0);
  hash.clear();
  assert.equal(hash.cellCount, 0);
});
