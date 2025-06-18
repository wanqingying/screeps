import { dc } from "types";

export * from "./config";
export * from "./helper"

export function process_tick() {}

export class EventBus {
  private listeners: Record<string, Function[]> = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }
}

export const tick_callbacks: Function[] = [];
export function setIntervalTick(tick: number, callback: () => void) {
  tick_callbacks.push(function () {
    if (Game.time % tick === 0) {
      callback();
    }
  });
}

export function getMemTarget<T>(creep: Creep) {
  if (creep.memory.target) {
    return Game.getObjectById(creep.memory.target as Id<any>) as T;
  }
  return null;
}


