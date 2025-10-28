import { useEffect, useState } from 'react';
import onChange from 'on-change';

type ExperimentsMap = Record<string, unknown>;
type Listener = () => void;

interface ExperimentsStore {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => ExperimentsMap;
}

const STORE_KEY = '__useExperimentStore__';

declare global {
  interface Window {
    experiments?: ExperimentsMap;
    [STORE_KEY]?: ExperimentsStore;
  }
}

const noopStore: ExperimentsStore = {
  subscribe: () => () => {},
  getSnapshot: () => ({}),
};

/**
 * Returns the current value of an experiment flag, keeping React components in sync with
 * runtime changes applied to the global `window.experiments` object.
 *
 * @param experimentName Name of the experiment flag to read.
 * @param defaultValue Fallback value while the experiment value is unavailable. Defaults to `false`.
 */
export function useExperiment<T = boolean>(
  experimentName: string,
  defaultValue: T = false as unknown as T,
): T {
  const store = getStore();
  const [value, setValue] = useState<T>(() => readExperiment(
    store.getSnapshot(),
    experimentName,
    defaultValue,
  ));

  useEffect(() => {
    setValue(readExperiment(store.getSnapshot(), experimentName, defaultValue));
    return store.subscribe(() => {
      setValue(readExperiment(store.getSnapshot(), experimentName, defaultValue));
    });
  }, [store, experimentName, defaultValue]);

  return value;
}

function readExperiment<T>(
  experiments: ExperimentsMap,
  experimentName: string,
  defaultValue: T,
): T {
  if (!experimentName) {
    return defaultValue;
  }

  const rawValue = experiments?.[experimentName];

  if (rawValue == null) {
    return defaultValue;
  }

  if (isBooleanLike(defaultValue)) {
    return normalizeBoolean(rawValue, defaultValue as unknown as boolean) as T;
  }

  return rawValue as T;
}

function isBooleanLike(value: unknown): value is boolean | undefined {
  return typeof value === 'boolean' || typeof value === 'undefined';
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return fallback;
    }
    return value !== 0;
  }

  if (value == null) {
    return fallback;
  }

  return Boolean(value);
}

function getStore(): ExperimentsStore {
  if (typeof window === 'undefined') {
    return noopStore;
  }

  const win = window as Window;
  if (win[STORE_KEY]) {
    return win[STORE_KEY]!;
  }

  const store = createBrowserStore(win);
  Object.defineProperty(win, STORE_KEY, {
    value: store,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return store;
}

function createBrowserStore(win: Window): ExperimentsStore {
  const listeners = new Set<Listener>();
  let snapshot = cloneExperiments(win.experiments);

  const emit = () => {
    snapshot = cloneExperiments(win.experiments);
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  win.experiments = wrapExperiments(win.experiments, emit);
  snapshot = cloneExperiments(win.experiments);

  return {
    getSnapshot: () => snapshot,
    subscribe,
  };
}

function wrapExperiments(
  experiments: ExperimentsMap | undefined,
  onUpdate: () => void,
): ExperimentsMap {
  const base = getRawExperiments(experiments);
  if (experiments) {
    onChange.unsubscribe(experiments);
  }
  return onChange(base, () => {
    onUpdate();
  });
}

function getRawExperiments(experiments: ExperimentsMap | undefined): ExperimentsMap {
  if (!experiments || typeof experiments !== 'object') {
    return {};
  }
  return onChange.target(experiments);
}

function cloneExperiments(experiments: ExperimentsMap | undefined): ExperimentsMap {
  const raw = getRawExperiments(experiments);
  return { ...raw };
}
