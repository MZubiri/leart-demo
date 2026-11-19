import source from '../../../backend/Leart.Api/Data/pricing-rules.json';
import { calculatePrice, figureLimit, petLimit, PricingRules } from './pricing';
import { PRODUCTS } from './products';

const rules = source as PricingRules;
const frame = PRODUCTS.find(product => product.category === 'Cuadros')!;
const box = PRODUCTS.find(product => product.category === 'Cajas acrílicas')!;

describe('Commercial pricing and capacity', () => {
  it('uses the chosen group instead of the first product group', () => {
    const product = PRODUCTS.find(product => product.category === 'Sets armables' && product.group === 'Grupo 1')!;
    expect(calculatePrice({ category: product.category, product, rules, variant: 'Grupo 4', figures: 1 }).totalPrice).toBe(165000);
  });
  it('respects a product-specific maximum instead of the category ceiling', () => {
    const product = PRODUCTS.find(product => product.id === 'set-hockey')!;
    expect(figureLimit(product, 'Grupo 1', rules)).toBe(4);
    expect(calculatePrice({ category: product.category, product, rules, variant: 'Grupo 1', figures: 5 }).valid).toBe(false);
  });
  it('shares frame capacity between people and pets', () => {
    expect(calculatePrice({ category: 'Cuadros', product: frame, rules, variant: frame.variants[0], figures: 2, pets: 1 }).totalPrice).toBe(139000);
    expect(calculatePrice({ category: 'Cuadros', product: frame, rules, variant: frame.variants[0], figures: 3, pets: 1 }).valid).toBe(false);
  });
  it('rejects quantities below the product minimum instead of silently clamping', () => {
    expect(calculatePrice({ category: 'Cuadros', product: { ...frame, minFigures: 2, basePrice: 124000 }, rules, variant: frame.variants[0], figures: 1 }).valid).toBe(false);
  });
  it('calculates the authorized simulated prices returned by the API for larger frames', () => {
    for (const [variant, figures, price] of [[frame.variants[1], 1, 116000], [frame.variants[2], 1, 146000], [frame.variants[2], 2, 168000]] as const) {
      const quote = calculatePrice({ category: 'Cuadros', product: frame, rules, variant, figures });
      expect(quote.valid).toBe(true); expect(quote.totalPrice).toBe(price);
      expect(quote.notes.join(' ')).toContain('Precio simulado');
    }
  });
  it('calculates using changed database rates without a frontend price fallback', () => {
    const updated = structuredClone(rules); updated.frames['M']['1'] = 117000;
    expect(calculatePrice({ category: 'Cuadros', product: frame, rules: updated, variant: frame.variants[1], figures: 1 }).totalPrice).toBe(117000);
    updated.frames['M']['1'] = null;
    expect(calculatePrice({ category: 'Cuadros', product: frame, rules: updated, variant: frame.variants[1], figures: 1 }).totalPrice).toBeNull();
  });
  it('does not ignore a custom base price or invent a markup rule', () => {
    const quote = calculatePrice({ category: 'Cuadros', product: { ...frame, basePrice: 500000 }, rules, variant: frame.variants[0], figures: 1 });
    expect(quote.valid).toBe(true); expect(quote.totalPrice).toBeNull();
  });
  it('honors pet and accessory permissions', () => {
    const product = { ...frame, allowsPets: false, allowsAccessories: false };
    expect(petLimit(product, frame.variants[0], 1, rules)).toBe(0);
    expect(calculatePrice({ category: 'Cuadros', product, rules, variant: frame.variants[0], figures: 1, pets: 1 }).valid).toBe(false);
    expect(calculatePrice({ category: 'Cuadros', product, rules, variant: frame.variants[0], figures: 1, accessories: true }).valid).toBe(false);
  });
  it('supports the spreadsheet combination of one person and one pet in a simple box', () => {
    expect(calculatePrice({ category: box.category, product: box, rules, variant: box.variants[0], figures: 1, pets: 1 }).totalPrice).toBe(75000);
  });
  it('uses the double-box pet limit for each figure count', () => {
    expect(petLimit(box, 'Caja Doble', 1, rules)).toBe(4);
    expect(petLimit(box, 'Caja Doble', 4, rules)).toBe(0);
    expect(calculatePrice({ category: box.category, product: box, rules, variant: 'Caja Doble', figures: 4, pets: 1 }).valid).toBe(false);
  });
  it('does not calculate prices when the rule source is unavailable', () => {
    expect(calculatePrice({ category: frame.category, product: frame, rules: null, variant: frame.variants[0], figures: 1 }).totalPrice).toBeNull();
  });
});
