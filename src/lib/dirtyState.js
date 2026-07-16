/** Stable JSON snapshot for dirty checking. */
export function snapshotState(value) {
  return JSON.stringify(value)
}

export function isDirty(current, baseline) {
  if (baseline == null) return false
  return snapshotState(current) !== baseline
}
