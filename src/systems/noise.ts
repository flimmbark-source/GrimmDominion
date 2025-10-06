import type { Vec2, NoiseEvent } from '../types';

type Subscriber = (event: NoiseEvent) => void;

const subscribers = new Set<Subscriber>();

export const Noise = {
  emit: (event: NoiseEvent) => subscribers.forEach((callback) => callback(event)),
  on: (callback: Subscriber) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }
};

export const emitFootsteps = (pos: Vec2) =>
  Noise.emit({
    pos,
    radius: 60,
    kind: 'steps'
  });
