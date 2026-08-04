import { describe, expect, it } from 'vitest';
import { applyOptimisticSaveRemoval, rollbackOptimisticSaveRemoval } from '../optimistic';

type TestSave = { id: string; name: string };

describe('save optimistic delete lifecycle', () => {
  it('removes the target save from the visible list', () => {
    const saves: TestSave[] = [
      { id: 'save-1', name: 'Alpha' },
      { id: 'save-2', name: 'Beta' },
      { id: 'save-3', name: 'Gamma' },
    ];

    expect(applyOptimisticSaveRemoval(saves, 'save-2')).toEqual([
      { id: 'save-1', name: 'Alpha' },
      { id: 'save-3', name: 'Gamma' },
    ]);
  });

  it('restores the save to its original position when rollback is needed', () => {
    const saves: TestSave[] = [
      { id: 'save-1', name: 'Alpha' },
      { id: 'save-2', name: 'Beta' },
      { id: 'save-3', name: 'Gamma' },
    ];

    const removed = applyOptimisticSaveRemoval(saves, 'save-2');

    expect(rollbackOptimisticSaveRemoval(removed, saves[1])).toEqual(saves);
  });
});
