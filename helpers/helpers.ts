/**
 * Natif avec ES2023. En attendant ...
 */
export function groupBy<T, K extends string>(array: T[], predicate: (value: T, index: number, array: T[]) => K) {
  return array.reduce(
    (acc, value, index, array) => {
      (acc[predicate(value, index, array)] ||= []).push(value);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * To ease comparison from user inputs
 */
export function removeDiacritics(string: string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase();
}

export async function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement | null> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const checkExist = setInterval(() => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        clearInterval(checkExist);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        resolve(null);
      }
    }, 100);
  });
}
