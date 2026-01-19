export type EntityId = string;

export function createIdGenerator(prefix: string): () => EntityId {
  let counter = 0;
  return () => {
    counter++;
    return `${prefix}_${counter}`;
  };
}

export function parseId(id: EntityId): { prefix: string; number: number } | null {
  const match = id.match(/^([a-zA-Z]+)_(\d+)$/);
  if (!match) {
    return null;
  }
  return {
    prefix: match[1],
    number: parseInt(match[2], 10),
  };
}
