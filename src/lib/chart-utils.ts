const DOW_IT_FULL = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/** Format a YYYY-MM-DD date for chart tooltips → "Lun 7/04/2026" */
export function formatTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DOW_IT_FULL[date.getDay()]} ${d}/${String(m).padStart(2, "0")}/${y}`;
}

/**
 * Compute evenly-spaced Y-axis ticks with a nice step size.
 *
 * @param min  - data minimum (may be negative for diverging charts)
 * @param max  - data maximum
 * @param targetCount - desired number of grid lines (3–6, default 5)
 * @returns { ticks, domain } — the tick array and the [min, max] domain to pass to YAxis
 */
export function niceYTicks(
  min: number,
  max: number,
  targetCount = 5
): { ticks: number[]; domain: [number, number] } {
  if (min === max) {
    // Flat data — create a small range around the value
    const v = min || 0;
    const step = v === 0 ? 10 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))));
    return {
      ticks: [v - step, v, v + step],
      domain: [v - step, v + step],
    };
  }

  const range = max - min;
  const rawStep = range / (targetCount - 1);

  // Round step to a nice number (1, 2, 5 × 10^n)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  // Expand domain to align with the step
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * 1e6) / 1e6); // avoid float drift
  }

  return { ticks, domain: [niceMin, niceMax] };
}

/**
 * Symmetric version for diverging charts (e.g. bilancio calorico).
 * Produces ticks symmetric around 0.
 */
export function niceSymmetricTicks(
  absMax: number,
  targetCount = 5
): { ticks: number[]; domain: [number, number] } {
  if (absMax <= 0) absMax = 100;

  // We want ~targetCount ticks total, symmetric around 0
  const halfCount = Math.floor(targetCount / 2);
  const rawStep = absMax / halfCount;

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const bound = niceStep * halfCount;

  const ticks: number[] = [];
  for (let v = -bound; v <= bound + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v));
  }

  return { ticks, domain: [-bound, bound] };
}
