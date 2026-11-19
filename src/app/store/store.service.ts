import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { ProductsService } from '../core/services/products.service';
import { SettingsService } from '../core/services/settings.service';
import { Product } from './products';
import { calculatePrice, formatCop } from './pricing';
import { PricingService } from '../core/services/pricing.service';

export interface CartConfiguration {
  variant: string;
  figures: number;
  pets: number;
  accessories: boolean;
  occasion: string;
  estimatedPrice?: number | null;
}

interface StoredCartLine {
  productId: string;
  quantity: number;
  note: string;
  configuration?: CartConfiguration;
}

export interface CartLine extends StoredCartLine {
  id: string;
  product: Product;
  quantity: number;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly productsService = inject(ProductsService);
  private readonly settingsService = inject(SettingsService);
  private readonly pricing = inject(PricingService);

  readonly productsSignal = this.productsService.products;
  readonly catalogLoading = this.productsService.loading;
  readonly catalogError = this.productsService.error;
  readonly catalogLoaded = this.productsService.loaded;
  readonly hasUnavailableLines = computed(() => Object.values(this.cart()).some((line) => !this.productsSignal().some((product) => product.id === line.productId && product.isActive !== false)));
  readonly quotationRulesReady = computed(() => !!this.pricing.rules());
  readonly hasInvalidConfigurations = computed(() => this.cartLines().some((line) => line.configuration && !calculatePrice({ ...line.configuration, product: line.product, category: line.product.category, rules: this.pricing.rules() }).valid));
  readonly canSendQuote = computed(() => this.catalogLoaded() && !this.catalogLoading() && !this.catalogError()
    && this.quotationRulesReady() && !this.hasInvalidConfigurations() && !this.hasUnavailableLines() && this.cartLines().length > 0 && this.settingsService.canContact());
  get products(): Product[] {
    return this.productsSignal();
  }

  readonly cart = signal<Record<string, StoredCartLine>>(this.loadCart());
  readonly cartOpen = signal(false);
  readonly customizerOpen = signal(false);
  readonly customizerProduct = signal<Product | null>(null);

  readonly cartLines = computed<CartLine[]>(() =>
    Object.entries(this.cart())
      .map(([id, line]) => {
        const found = this.productsSignal().find((p) => p.id === line.productId && p.isActive !== false);
        return { id, product: found!, ...line };
      })
      .filter((line) => line.product),
  );

  readonly cartCount = computed(() => this.cartLines().reduce((total, line) => total + line.quantity, 0));

  constructor() {
    effect(() => {
      try { localStorage.setItem('leart-cart', JSON.stringify({ version: 2, lines: this.cart() })); } catch { /* La selección en memoria sigue disponible. */ }
    });
  }

  private loadCart(): Record<string, StoredCartLine> {
    try {
      const saved = JSON.parse(localStorage.getItem('leart-cart') || '{}');
      const source = saved?.version === 2 ? saved.lines : saved;
      if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
      const aliases: Record<string, string> = {
        'cuadro-personalizado': 'cuadro-1-persona', 'box-taller': 'caja-taller',
        'box-fitness': 'caja-fitness', 'box-buena-vibra': 'caja-buena-vibra',
      };
      const result: Record<string, StoredCartLine> = Object.create(null);
      for (const [id, value] of Object.entries(source)) {
        if (!value || typeof value !== 'object') continue;
        const line = value as Partial<StoredCartLine>;
        const productId = saved.version === 2 ? line.productId : (aliases[id] || id);
        if (typeof productId !== 'string' || !Number.isSafeInteger(line.quantity) || line.quantity! < 1
          || typeof line.note !== 'string') continue;
        const configuration = line.configuration;
        if (configuration && (typeof configuration.variant !== 'string' || !Number.isInteger(configuration.figures)
          || configuration.figures < 1 || !Number.isInteger(configuration.pets) || configuration.pets < 0
          || typeof configuration.accessories !== 'boolean' || typeof configuration.occasion !== 'string')) continue;
        result[id] = { productId, quantity: line.quantity!, note: line.note, configuration };
      }
      return result;
    } catch { return {}; }
  }

  add(product: Product, note = '', configuration?: CartConfiguration): void {
    const signature = (config?: CartConfiguration) => config ? JSON.stringify([
      config.variant, config.figures, config.pets, config.accessories, config.occasion, config.estimatedPrice,
    ]) : '';
    this.cart.update((cart) => {
      const existing = Object.entries(cart).find(([, line]) => line.productId === product.id
        && line.note === note && signature(line.configuration) === signature(configuration));
      const id = existing?.[0] ?? Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, '0')).join('');
      return { ...cart, [id]: { productId: product.id, quantity: (existing?.[1].quantity ?? 0) + 1,
        note, configuration: configuration ? { ...configuration } : undefined } };
    });
    this.openCart();
  }

  configurationSummary(configuration?: CartConfiguration, product?: Product): string {
    if (!configuration) return '';
    const quote = product ? calculatePrice({ ...configuration, category: product.category, product, rules: this.pricing.rules() }) : null;
    const price = quote ? quote.totalPrice : configuration.estimatedPrice;
    return [configuration.variant, configuration.figures + ' minifigura(s)',
      configuration.pets ? configuration.pets + ' mascota(s)' : '',
      configuration.accessories ? 'Consultar accesorios' : '', configuration.occasion,
      price != null ? 'Estimado: ' + formatCop(price) : 'A cotizar',
      quote && !quote.valid ? 'Revisar configuración con Leart' : '',
    ].filter(Boolean).join(' · ');
  }

  changeQuantity(id: string, change: number): void {
    this.cart.update((cart) => {
      if (!cart[id] || !Number.isSafeInteger(change)) return cart;
      const updated = { ...cart };
      const next = (updated[id]?.quantity || 0) + change;
      if (next <= 0) delete updated[id];
      else updated[id] = { ...updated[id], quantity: next };
      return updated;
    });
  }

  updateNote(id: string, note: string): void {
    this.cart.update((cart) => cart[id] ? ({ ...cart, [id]: { ...cart[id], note } }) : cart);
  }

  refreshProducts(): void { this.productsService.refresh(); }

  removeUnavailableLines(): void {
    if (!this.catalogLoaded() || this.catalogLoading() || this.catalogError()) return;
    this.cart.update((cart) => Object.fromEntries(Object.entries(cart).filter(([, line]) =>
      this.productsSignal().some((product) => product.id === line.productId && product.isActive !== false))));
  }

  clear(): void {
    this.cart.set({});
  }

  openCart(): void {
    this.cartOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCart(): void {
    this.cartOpen.set(false);
    document.body.style.overflow = '';
  }

  openCustomizer(product: Product | null = null): void {
    this.customizerProduct.set(product);
    this.customizerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCustomizer(): void {
    this.customizerOpen.set(false);
    document.body.style.overflow = '';
  }

  whatsappUrl(): string {
    if (Object.keys(this.cart()).length && !this.canSendQuote()) return '';
    const lines = this.cartLines().map(
      (line) =>
        `• ${line.quantity}x ${line.product.name} — ${line.product.category} (${line.product.detail})${
          [this.configurationSummary(line.configuration, line.product), line.note].filter(Boolean).length
            ? `\n  Detalles: ${[this.configurationSummary(line.configuration, line.product), line.note].filter(Boolean).join(' · ')}` : ''
        }`,
    );

    const message = this.cartLines().length
      ? `Hola Leart 👋 Quiero cotizar esta selección:\n\n${lines.join(
          '\n',
        )}\n\nMi nombre es:\nCiudad de envío:\nFecha en que lo necesito:`
      : 'Hola Leart 👋 Quiero información para cotizar un regalo personalizado.';

    return this.settingsService.buildWhatsAppUrl(message);
  }
}
