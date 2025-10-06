// Simple in-memory event bus for small cross-screen notifications
type Handler = (...args: any[]) => void;
const events: Map<string, Set<Handler>> = new Map();

export const on = (name: string, handler: Handler) => {
  let set = events.get(name);
  if (!set) {
    set = new Set();
    events.set(name, set);
  }
  set.add(handler);
  return () => off(name, handler);
};

export const off = (name: string, handler: Handler) => {
  const set = events.get(name);
  if (!set) return;
  set.delete(handler);
  if (set.size === 0) events.delete(name);
};

export const emit = (name: string, ...args: any[]) => {
  const set = events.get(name);
  if (!set) return;
  // copy to avoid mutation during iteration
  const handlers = Array.from(set);
  for (const h of handlers) {
    try {
      h(...args);
    } catch (e) {
      // swallow to avoid breaking other handlers
      // eslint-disable-next-line no-console
      console.error(`Event handler for ${name} failed`, e);
    }
  }
};

export default { on, off, emit };
