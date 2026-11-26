import config from '~/config.json';

export type LineCategory = 'main' | 'secondary' | 'other';

export function getMainLineNumbers(): number[] {
  return Array.from({ length: config.nbVoiesCyclables }, (_, index) => index + 1);
}

export function getSecondaryLineNumbers(): number[] {
  return config.secondaryLines.lines.map((secondaryLine) => secondaryLine.line);
}

export function getOtherNetworkLineNumbers(): number[] {
  return config.otherNetworks.map((network) => network.line);
}

export function getSecondaryLine(line: number | undefined) {
  return config.secondaryLines.lines.find((secondaryLine) => secondaryLine.line === line);
}

export function getSecondaryLineByLetter(letter: string) {
  return config.secondaryLines.lines.find((secondaryLine) => secondaryLine.letter === letter.toUpperCase());
}

export function getLineFileName(line: number): string {
  const secondaryLine = getSecondaryLine(line);
  return `ligne-${secondaryLine ? secondaryLine.letter.toLowerCase() : line}`;
}

export function getLineFromFileName(path: string | undefined): number | undefined {
  const match = path?.match(/ligne-(\d+|[a-z]+)$/i);
  if (!match) {
    return undefined;
  }
  const name = match[1]!;
  return /^\d+$/.test(name) ? Number(name) : getSecondaryLineByLetter(name)?.line;
}

export function getOtherNetwork(line: number | undefined) {
  return config.otherNetworks.find((network) => network.line === line);
}

export function getLineCategory(line: number | undefined): LineCategory {
  if (getSecondaryLine(line)) {
    return 'secondary';
  }
  if (getOtherNetwork(line)) {
    return 'other';
  }
  return 'main';
}
