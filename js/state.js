import { loadState, saveState } from "./storage.js";
import { MAX_SAFE_OCCURRENCES, OCCURRENCES_PER_WARNING } from "./policy.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const defaultState = {
  warnings: 0,
  extraCallouts: 0,
  oldestWarningExpires: "",
  simDates: []
};

let state = Object.assign({}, defaultState, loadState() || {});

export function getState() {
  return state;
}

export function setWarnings(value) {
  state.warnings = Math.max(0, Math.min(3, Number(value) || 0));
  persist();
}

export function setExtraCallouts(v) {
  state.extraCallouts = Math.max(0, Math.min(2, Number(v) || 0));
  persist();
}

export function setOldestWarningExpires(d) {
  state.oldestWarningExpires = d || "";
  persist();
}

// MULTI-DATE SIMULATION
export function getSimDates() {
  return state.simDates;
}

export function addSimDate(dateStr) {
  if (!dateStr) return;
  if (!state.simDates.includes(dateStr)) {
    state.simDates.push(dateStr);
    persist();
  }
}

export function removeSimDate(dateStr) {
  state.simDates = state.simDates.filter(d => d !== dateStr);
  persist();
}

function persist() {
  saveState(state);
}

// Derived values
export function computeOccurrences() {
  const simCount = state.simDates.length;
  const occ = state.warnings * OCCURRENCES_PER_WARNING + state.extraCallouts + simCount;
  const remaining = MAX_SAFE_OCCURRENCES - occ;
  return { total: occ, remaining };
}

export function getTodayISO() {
  return todayISO();
}
