import { loadState, saveState } from "./storage.js";
import { MAX_SAFE_OCCURRENCES, OCCURRENCES_PER_WARNING } from "./policy.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const defaultState = {
  warnings: 0,
  extraCallouts: 0,
  oldestWarningExpires: "",
  simDate: ""
};

let state = Object.assign({}, defaultState, loadState() || {});

export function getState() {
  return state;
}

export function setWarnings(value) {
  const v = Math.min(3, Math.max(0, Number(value) || 0));
  state.warnings = v;
  persist();
}

export function setExtraCallouts(value) {
  const v = Math.min(2, Math.max(0, Number(value) || 0));
  state.extraCallouts = v;
  persist();
}

export function setOldestWarningExpires(dateStr) {
  state.oldestWarningExpires = dateStr || "";
  persist();
}

export function setSimDate(dateStr) {
  state.simDate = dateStr || "";
  persist();
}

function persist() {
  saveState(state);
}

// Derived

export function computeOccurrences() {
  const { warnings, extraCallouts } = state;
  const occ = warnings * OCCURRENCES_PER_WARNING + extraCallouts;
  const remaining = MAX_SAFE_OCCURRENCES - occ;
  return { total: occ, remaining };
}

export function getTodayISO() {
  return todayISO();
}

