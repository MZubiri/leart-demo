/** Sustitución única: los valores del cliente nunca se reinterpretan como variables. */
export function renderMessageTemplate(template: string, values: Record<string, string>, labels: Record<string, string>): string {
  const used = new Set<string>();
  const rendered = template.replace(/\{([a-z]+)\}/g, (match, key: string) => {
    if (!Object.hasOwn(values, key)) return match;
    used.add(key); return values[key];
  });
  const missing = Object.entries(values).filter(([key, value]) => !used.has(key) && value.trim())
    .map(([key, value]) => labels[key] ? labels[key] + ': ' + value : value);
  return [rendered.trim(), ...missing].filter(Boolean).join('\n\n');
}
