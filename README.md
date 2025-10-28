# use-experiment

`use-experiment` is a tiny React hook that turns changes on `window.experiments` into reactive values. Once your experiment platform (or any custom script) populates that global object, components can flip features on and off without wiring a provider or prop plumbing.

## Installation

```bash
npm install use-experiment
```

## Runtime setup

Ensure `window.experiments` exists before React mounts. This can be as simple as:

```html
<script>
  window.experiments = window.experiments || {};
</script>
```

If you already inject experiments from a tag manager or SDK, just make sure it writes to the same global object.

## Usage

```tsx
import { useExperiment } from 'use-experiment';

function SeatUpsell() {
  const isEnabled = useExperiment('showSeatUpsell');

  if (!isEnabled) {
    return null;
  }

  return <UpsellContent />;
}
```

### Custom value types

The hook is generic (`useExperiment<T = boolean>`), so you can opt into any value type by passing a typed fallback:

```tsx
const treatment = useExperiment<string>('checkoutLayout', 'control');
const maxItems = useExperiment<number>('itemsPerPage', 10);
```

If `window.experiments.checkoutLayout` hasn’t been set yet, the hook will return `'control'`. Once the experiment loader writes a string there, the component re-renders with the new value.

## How it works

- Reads and clones the global `window.experiments` object.
- Wraps it with [`on-change`](https://github.com/sindresorhus/on-change) to get notified whenever a flag is mutated.
- Keeps a single shared store on `window`, so every hook call shares the same subscription.
- Normalizes booleans (`true`/`false`, `"yes"`, `"0"`, numbers, etc.) when you use the default boolean shape, or returns the raw value for any custom type you opt into.

Because the hook owns the proxy, **no extra provider is required**—call `useExperiment` wherever you need a flag.

## Scripts

- `npm run build` &mdash; outputs CJS, ESM and `.d.ts` files under `dist/` via `tsup`.
- `npm run dev` &mdash; rebuilds on file changes.
