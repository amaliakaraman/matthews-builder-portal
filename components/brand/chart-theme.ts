/**
 * Matthews data-viz palette per PRD §7.2.6.
 * "Color sequence for series (use in this order, do not skip)."
 *
 * For light backgrounds use ELECTRIC_LIGHT first; for dark surfaces use
 * ELECTRIC_DARK first. Both sequences keep the rest of the order identical.
 */

export const CHART_SERIES_LIGHT = [
  "#2b77fc", // Electric Blue (light bg)
  "#0e1a34", // Deep Blue
  "#a5a0ff", // Horizon Lavender
  "#3b2997", // Nexus Indigo
  "#4ec4cf", // Ion Aqua
];

export const CHART_SERIES_DARK = [
  "#4e8eff", // Electric Blue (dark bg)
  "#ffffff", // White stand-in for Deep on dark
  "#a5a0ff",
  "#3b2997",
  "#4ec4cf",
];

export const AXIS_COLOR = "#0e1a34";
export const AXIS_NUM_COLOR = "rgba(0,0,0,0.8)"; // 80% black per PRD §7.2.6
export const SOURCE_COLOR = "rgba(0,0,0,0.6)"; // 60% black per PRD §7.2.6
