import { Category, Product } from './products';

export interface PricingRules {
  currency: string;
  version: number;
  extraPrices: Record<string, number>;
  frames: Record<string, Record<string, number | null>>;
  sets: Record<string, { p1: number; p2: number; extra: number }>;
  moments: Record<string, { p1: number; p2: number; extra: number }>;
  variants: Record<Category, string[]>;
  defaultLimits: Record<Category, number>;
  frameLimits: Record<string, number>;
  acrylicPetLimits: Record<string, number>;
  acrylic: { simple: number; double: Record<string, number>; moto: Record<string, number>; maxFigures: { simple: number; double: number; moto: number }; simpleMaxPets: number; motoMaxPets: number };
  miniBoxBase: number;
}

export interface PriceBreakdown {
  basePrice: number;
  figuresExtra: number;
  petsExtra: number;
  accessoriesExtra: number;
  otherExtras: number;
  totalPrice: number | null;
  valid: boolean;
  currency: string;
  notes: string[];
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export function frameSize(variant: string): string | undefined {
  return variant.match(/\b(?:Talla|Tamaño)\s+([SML])\b/i)?.[1]?.toUpperCase();
}

export function setGroup(variant: string, rules: PricingRules): string | undefined {
  return Object.keys(rules.sets).find((group) => group.toLowerCase() === variant.toLowerCase());
}

export function figureLimit(product: Product, variant: string, rules: PricingRules): number {
  let limit = rules.defaultLimits[product.category];
  if (product.category === 'Cuadros') limit = rules.frameLimits[frameSize(variant) ?? ''] ?? 0;
  if (product.category === 'Cajas acrílicas') limit = /sencilla/i.test(variant) ? rules.acrylic.maxFigures.simple : /moto/i.test(variant) ? rules.acrylic.maxFigures.moto : rules.acrylic.maxFigures.double;
  return Math.min(product.maxFigures, limit);
}

export function petLimit(product: Product, variant: string, figures: number, rules: PricingRules): number {
  if (!product.allowsPets) return 0;
  if (product.category === 'Cajas acrílicas') {
    if (/sencilla/i.test(variant)) return rules.acrylic.simpleMaxPets;
    if (/moto/i.test(variant)) return rules.acrylic.motoMaxPets;
    return rules.acrylicPetLimits[figures] ?? 0;
  }
  return Math.max(0, figureLimit(product, variant, rules) - figures);
}

const unpriced = (message: string, valid = false): PriceBreakdown => ({
  basePrice: 0, figuresExtra: 0, petsExtra: 0, accessoriesExtra: 0, otherExtras: 0,
  totalPrice: null, valid, currency: 'COP', notes: [message],
});

function momentMode(variant: string): string {
  return /sin luz/i.test(variant) ? 'sin-luz' : /mini armable/i.test(variant) ? 'mini-armables' : 'con-luz';
}

function standardBase(product: Product, rules: PricingRules): number | null | undefined {
  const first = product.variants[0] ?? '';
  switch (product.category) {
    case 'Cuadros': return rules.frames[frameSize(first) ?? 'S']?.[product.minFigures];
    case 'Sets armables': return rules.sets[product.group || setGroup(first, rules) || '']?.p1;
    case 'Mini momentos': return rules.moments[momentMode(first)]?.p1;
    case 'Cajas acrílicas': return /sencilla/i.test(first) ? rules.acrylic.simple : /moto/i.test(first) ? rules.acrylic.moto[1] : rules.acrylic.double[1];
    case 'Mini Box': return rules.miniBoxBase;
    case 'Llaveros': return rules.extraPrices['llaveroIndividual'];
    case 'Minifiguras': return rules.extraPrices['minifiguraIndividual'];
  }
}

export function calculatePrice(options: {
  category: Category; variant: string; figures: number; pets?: number; accessories?: boolean;
  product?: Product | null; rules?: PricingRules | null;
}): PriceBreakdown {
  const { category, variant, figures, pets = 0, accessories = false, product, rules } = options;
  if (!rules) return unpriced('Las tarifas todavía no están disponibles.');
  if (!product || product.category !== category || !(category in rules.defaultLimits) || !Number.isInteger(figures) || !Number.isInteger(pets) || figures < product.minFigures
    || figures > figureLimit(product, variant, rules) || pets < 0 || pets > petLimit(product, variant, figures, rules)
    || (accessories && !product.allowsAccessories)) return unpriced('Revisa cantidades y extras permitidos para esta presentación.');

  const expectedBase = standardBase(product, rules);
  if (product.basePrice == null || expectedBase == null || product.basePrice !== expectedBase)
    return unpriced('El precio de este producto requiere confirmación con Leart.', true);

  let basePrice = 0;
  let figuresExtra = 0;
  const petsExtra = pets * rules.extraPrices['mascota'];
  const notes: string[] = [];
  switch (category) {
    case 'Cuadros': {
      const price = rules.frames[frameSize(variant) ?? '']?.[figures];
      if (price == null) return unpriced('Esta combinación de talla y figuras requiere cotización.', true);
      basePrice = price; break;
    }
    case 'Sets armables': {
      const group = setGroup(variant, rules) ?? product.group;
      const rates = group ? rules.sets[group] : undefined;
      if (!rates) return unpriced('Este grupo requiere cotización.', true);
      basePrice = figures === 1 ? rates.p1 : rates.p2;
      figuresExtra = Math.max(0, figures - 2) * rates.extra;
      notes.push(group!); break;
    }
    case 'Mini momentos': {
      const rates = rules.moments[momentMode(variant)];
      basePrice = figures === 1 ? rates.p1 : rates.p2;
      figuresExtra = Math.max(0, figures - 2) * rates.extra; break;
    }
    case 'Cajas acrílicas':
      basePrice = /sencilla/i.test(variant) ? rules.acrylic.simple : /moto/i.test(variant) ? rules.acrylic.moto[figures] : rules.acrylic.double[figures]; break;
    case 'Mini Box': basePrice = rules.miniBoxBase; figuresExtra = (figures - 1) * rules.extraPrices['minifiguraSetExtra']; break;
    case 'Llaveros': basePrice = rules.extraPrices['llaveroIndividual']; break;
    case 'Minifiguras': basePrice = rules.extraPrices['minifiguraIndividual'] * figures; break;
  }
  notes.push(`${figures} minifigura(s)`, pets ? `${pets} mascota(s)` : '');
  if (accessories) notes.push('Accesorios pendientes de cotización; no incluidos en el estimado.');
  return { basePrice, figuresExtra, petsExtra, accessoriesExtra: 0, otherExtras: 0,
    totalPrice: basePrice + figuresExtra + petsExtra, valid: true, currency: rules.currency, notes: notes.filter(Boolean) };
}
