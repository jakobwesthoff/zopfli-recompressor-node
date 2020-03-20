export const padToLength = (input: string, length: number, char: string): string => {
  if (input.length >= length) {
    return input;
  }

  const padCount = length - input.length;
  const padding = char.repeat(padCount);

  return `${padding}${input}`;
};
