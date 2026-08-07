import { SavedDecision } from '../types';

const STORAGE_KEY = 'the_tiebreaker_saved_decisions';

export function getSavedDecisions(): SavedDecision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading saved decisions:', e);
    return [];
  }
}

export function saveDecision(decision: SavedDecision): SavedDecision[] {
  try {
    const current = getSavedDecisions();
    const existingIdx = current.findIndex(d => d.id === decision.id);
    let updated: SavedDecision[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = decision;
    } else {
      updated = [decision, ...current];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving decision:', e);
    return getSavedDecisions();
  }
}

export function deleteSavedDecision(id: string): SavedDecision[] {
  try {
    const current = getSavedDecisions();
    const updated = current.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting decision:', e);
    return getSavedDecisions();
  }
}

export function updateDecisionResolution(id: string, isResolved: boolean, chosenOption?: string, notes?: string): SavedDecision[] {
  try {
    const current = getSavedDecisions();
    const updated = current.map(d => {
      if (d.id === id) {
        return {
          ...d,
          isResolved,
          chosenOption,
          resolutionNotes: notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error updating decision resolution:', e);
    return getSavedDecisions();
  }
}
