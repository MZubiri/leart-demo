import { Category, Product } from './products';

export interface PriceBreakdown {
  basePrice: number;
  figuresExtra: number;
  petsExtra: number;
  accessoriesExtra: number;
  otherExtras: number;
  totalPrice: number;
  currency: string;
  notes: string[];
}

export const EXTRA_PRICES = {
  mascota: 15000,
  bebe: 14000,
  moto: 18000,
  ladrilloNombre: 8000,
  paredEspecial: 18000,
  fondoPersonalizado: 8000,
  minifiguraSetExtra: 24000,
  minifiguraMomentoExtra: 26000,
  minifiguraIndividual: 24000,
  llaveroIndividual: 28000,
};

export const CUADROS_GRID: Record<'S' | 'M' | 'L', Record<number, number>> = {
  S: { 1: 96000, 2: 124000, 3: 146000 },
  M: { 1: 124000, 2: 138000, 3: 160000, 4: 180000, 5: 200000, 6: 220000 },
  L: { 1: 150000, 2: 170000, 3: 190000, 4: 210000, 5: 230000, 6: 250000, 7: 270000, 8: 290000, 9: 310000, 10: 330000 },
};

export const SETS_GRID: Record<string, { p1: number; p2: number; extra: number }> = {
  'Grupo 1': { p1: 130000, p2: 158000, extra: 24000 },
  'Grupo 2': { p1: 140000, p2: 168000, extra: 24000 },
  'Grupo 3': { p1: 154000, p2: 182000, extra: 24000 },
  'Grupo 4': { p1: 165000, p2: 195000, extra: 24000 },
  'Edición Especial Casita UP': { p1: 273000, p2: 295000, extra: 24000 },
  'Casita UP': { p1: 273000, p2: 295000, extra: 24000 },
  'Skyline': { p1: 165000, p2: 195000, extra: 24000 },
};

export const MINI_MOMENTOS_GRID: Record<string, { p1: number; p2: number; extra: number }> = {
  'con-luz': { p1: 184000, p2: 210000, extra: 26000 },
  'sin-luz': { p1: 164000, p2: 190000, extra: 26000 },
  'mini-armables': { p1: 134000, p2: 160000, extra: 26000 },
};

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculatePrice(options: {
  category: Category;
  variant: string;
  figures: number;
  pets?: number;
  accessories?: boolean;
  product?: Product | null;
}): PriceBreakdown {
  const { category, variant, figures, pets = 0, accessories = false, product } = options;
  const notes: string[] = [];
  let basePrice = 0;
  let figuresExtra = 0;
  let petsExtra = pets * EXTRA_PRICES.mascota;
  let accessoriesExtra = 0;
  let otherExtras = 0;

  if (category === 'Cuadros') {
    let size: 'S' | 'M' | 'L' = 'S';
    if (variant.includes('Talla M') || variant.includes('Tamaño M')) size = 'M';
    else if (variant.includes('Talla L') || variant.includes('Tamaño L')) size = 'L';

    const safeFigs = Math.max(1, Math.min(size === 'S' ? 3 : size === 'M' ? 6 : 10, figures));
    basePrice = CUADROS_GRID[size][safeFigs] ?? (size === 'S' ? 96000 : size === 'M' ? 138000 : 190000);
    notes.push(`Cuadro Talla ${size} con ${safeFigs} minifigura(s)`);
    if (pets > 0) notes.push(`${pets} mascota(s) (+$${(pets * EXTRA_PRICES.mascota).toLocaleString('es-CO')})`);
  } else if (category === 'Cajas acrílicas') {
    const isSencilla = variant.toLowerCase().includes('sencilla') || variant.includes('máx. 1');
    const isMoto = variant.toLowerCase().includes('moto');

    if (isSencilla) {
      basePrice = 60000;
      notes.push('Caja sencilla con 1 minifigura');
    } else if (isMoto) {
      if (figures <= 1) {
        basePrice = 88000;
        notes.push('Caja doble con 1 minifigura + Moto');
      } else {
        basePrice = 106000;
        notes.push('Caja doble con 2 minifiguras + Moto');
      }
    } else {
      if (figures <= 1) basePrice = 70000;
      else if (figures === 2) basePrice = 90000;
      else if (figures === 3) basePrice = 114000;
      else basePrice = 138000;
      notes.push(`Caja doble con ${figures} minifigura(s)`);
    }
    if (pets > 0) notes.push(`${pets} mascota(s) (+$${(pets * EXTRA_PRICES.mascota).toLocaleString('es-CO')})`);
  } else if (category === 'Sets armables') {
    const groupKey =
      product?.group ||
      (variant.includes('Grupo 4') ? 'Grupo 4' :
       variant.includes('Grupo 3') ? 'Grupo 3' :
       variant.includes('Grupo 2') ? 'Grupo 2' :
       variant.includes('Casita UP') ? 'Casita UP' :
       variant.includes('Skyline') ? 'Skyline' : 'Grupo 1');

    const rates = SETS_GRID[groupKey] || SETS_GRID['Grupo 1'];
    if (figures <= 1) {
      basePrice = rates.p1;
      notes.push(`${groupKey} con 1 minifigura`);
    } else if (figures === 2) {
      basePrice = rates.p2;
      notes.push(`${groupKey} con 2 minifiguras`);
    } else {
      basePrice = rates.p2;
      figuresExtra = (figures - 2) * rates.extra;
      notes.push(`${groupKey} con 2 minifiguras + ${figures - 2} adicional(es)`);
    }
    if (pets > 0) notes.push(`${pets} mascota(s) (+$${(pets * EXTRA_PRICES.mascota).toLocaleString('es-CO')})`);
  } else if (category === 'Mini momentos') {
    let mode = 'con-luz';
    if (variant.toLowerCase().includes('sin luz')) mode = 'sin-luz';
    else if (variant.toLowerCase().includes('mini armable')) mode = 'mini-armables';

    const rates = MINI_MOMENTOS_GRID[mode] || MINI_MOMENTOS_GRID['con-luz'];
    if (figures <= 1) {
      basePrice = rates.p1;
      notes.push(`Mini momento con 1 minifigura`);
    } else if (figures === 2) {
      basePrice = rates.p2;
      notes.push(`Mini momento con 2 minifiguras`);
    } else {
      basePrice = rates.p2;
      figuresExtra = (figures - 2) * rates.extra;
      notes.push(`Mini momento con ${figures} minifiguras`);
    }
    if (pets > 0) notes.push(`${pets} mascota(s)`);
  } else if (category === 'Mini Box') {
    basePrice = 70000;
    notes.push('Mini Box con mini set incluido');
    if (figures > 1) figuresExtra = (figures - 1) * EXTRA_PRICES.minifiguraSetExtra;
    if (pets > 0) notes.push(`${pets} mascota(s)`);
  } else if (category === 'Llaveros') {
    basePrice = EXTRA_PRICES.llaveroIndividual;
    notes.push('Llavero personalizado con 1 minifigura');
  } else if (category === 'Minifiguras') {
    basePrice = EXTRA_PRICES.minifiguraIndividual * figures;
    notes.push(`${figures} minifigura(s) individual(es)`);
  }

  if (accessories) {
    notes.push('Accesorios sujetos a cotización según catálogo');
  }

  const totalPrice = basePrice + figuresExtra + petsExtra + accessoriesExtra + otherExtras;

  return {
    basePrice,
    figuresExtra,
    petsExtra,
    accessoriesExtra,
    otherExtras,
    totalPrice,
    currency: 'COP',
    notes,
  };
}
