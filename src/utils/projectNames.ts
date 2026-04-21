const adjectives = [
  'Cosmic',
  'Neon',
  'Stellar',
  'Lunar',
  'Solar',
  'Cyber',
  'Pixel',
  'Quantum',
  'Atomic',
  'Crystal',
  'Shadow',
  'Thunder',
  'Frost',
  'Ember',
  'Nova',
  'Zen',
  'Turbo',
  'Hyper',
  'Ultra',
  'Mega',
];

const nouns = [
  'App',
  'Hub',
  'Lab',
  'Forge',
  'Studio',
  'Dash',
  'Flow',
  'Spark',
  'Pulse',
  'Wave',
  'Core',
  'Grid',
  'Deck',
  'Vault',
  'Nexus',
  'Port',
  'Base',
  'Edge',
  'Link',
  'Node',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProjectName(): string {
  return `${pick(adjectives)} ${pick(nouns)}`;
}
