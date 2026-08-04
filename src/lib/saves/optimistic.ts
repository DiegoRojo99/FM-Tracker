export function applyOptimisticSaveRemoval<T extends { id: string }>(saves: T[], saveId: string): T[] {
  return saves.filter((save) => save.id !== saveId);
}

export function rollbackOptimisticSaveRemoval<T extends { id: string }>(saves: T[], saveToRestore: T): T[] {
  const restored = saves.filter((save) => save.id !== saveToRestore.id);
  return [...restored.slice(0, 1), saveToRestore, ...restored.slice(1)];
}
