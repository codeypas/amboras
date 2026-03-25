export function startOfUtcDay(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function startOfUtcWeek(input: Date): Date {
  const day = startOfUtcDay(input);
  const dayOfWeek = day.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  day.setUTCDate(day.getUTCDate() - mondayOffset);
  return day;
}

export function startOfUtcMonth(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1));
}

export function formatUtcDate(input: Date): string {
  return input.toISOString().slice(0, 10);
}

export function subtractUtcDays(input: Date, days: number): Date {
  const result = new Date(input);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}
