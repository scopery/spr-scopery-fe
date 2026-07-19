import type { Value } from 'platejs'

/** Empty Plate document — kept separate from plate-config so hooks don't pull the full plugin graph. */
export function emptyPlateValue(): Value {
  return [{ type: 'p', children: [{ text: '' }] }] as Value
}
