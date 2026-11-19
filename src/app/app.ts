import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PricingService } from './core/services/pricing.service';
import { SettingsService } from './core/services/settings.service';
import { calculatePrice, figureLimit, formatCop, petLimit, setGroup } from './store/pricing';
import { CATEGORY_SHOWCASE, Category, OCCASIONS, Product } from './store/products';
import { StoreService } from './store/store.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  private readonly router = inject(Router);
  readonly settingsService = inject(SettingsService);
  readonly pricing = inject(PricingService);
  readonly store = inject(StoreService);
  readonly settings = this.settingsService.settings;
  readonly currentUrl = signal(this.router.url);
  readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));
  readonly formats = CATEGORY_SHOWCASE;
  readonly occasions = OCCASIONS;
  readonly menuOpen = signal(false);
  readonly activeStep = signal(1);
  readonly selectedCategory = signal<Category>('Cuadros');
  readonly selectedVariant = signal('');
  readonly figures = signal(1);
  readonly pets = signal(0);
  readonly accessories = signal(false);
  readonly occasion = signal('Aniversario');
  readonly notes = signal('');

  readonly selectedProduct = computed(() => {
    const requested = this.store.customizerProduct();
    if (requested?.category === this.selectedCategory()) return requested;
    const rules = this.pricing.rules();
    const group = rules && this.selectedCategory() === 'Sets armables' ? setGroup(this.selectedVariant(), rules) : null;
    return this.store.productsSignal().find((product) => product.category === this.selectedCategory() && (!group || product.group === group));
  });
  readonly variants = computed(() => {
    const rules = this.pricing.rules();
    if (!rules) return [];
    const requested = this.store.customizerProduct();
    const product = requested?.category === this.selectedCategory() ? requested : undefined;
    const variants = product?.variants.length ? product.variants : rules.variants[this.selectedCategory()] ?? [];
    return [...new Set(variants.map((value) => this.selectedCategory() === 'Mini momentos'
      ? value.replace(/\s*\(\d+ minifiguras?\)/i, '') : value))]
      .filter((variant) => !product || figureLimit(product, variant, rules) >= product.minFigures);
  });
  readonly cuadroProducts = computed(() => this.store.productsSignal().filter((product) => product.category === 'Cuadros'));
  readonly minFigures = computed(() => this.selectedProduct()?.minFigures ?? 1);
  readonly maxFigures = computed(() => {
    const product = this.selectedProduct(), rules = this.pricing.rules();
    return product && rules ? figureLimit(product, this.selectedVariant(), rules) : 0;
  });
  readonly maxPets = computed(() => {
    const product = this.selectedProduct(), rules = this.pricing.rules();
    return product && rules ? petLimit(product, this.selectedVariant(), this.figures(), rules) : 0;
  });
  readonly canIncreaseFigures = computed(() => {
    const product = this.selectedProduct(), rules = this.pricing.rules(), next = this.figures() + 1;
    return !!product && !!rules && next <= this.maxFigures() && this.pets() <= petLimit(product, this.selectedVariant(), next, rules);
  });
  readonly capacityUsed = computed(() => this.figures() + this.pets());
  readonly totalCapacity = computed(() => Math.max(this.maxFigures(), this.figures() + this.maxPets()));
  readonly priceQuote = computed(() => calculatePrice({
    category: this.selectedCategory(), variant: this.selectedVariant(), figures: this.figures(),
    pets: this.pets(), accessories: this.accessories(), product: this.selectedProduct(), rules: this.pricing.rules(),
  }));
  readonly formattedEstimatedPrice = computed(() => this.priceQuote().totalPrice == null ? 'A cotizar' : formatCop(this.priceQuote().totalPrice!));
  readonly canAdd = computed(() => !!this.selectedProduct() && this.priceQuote().valid && this.variants().includes(this.selectedVariant()));

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects || event.url));
    effect(() => {
      const open = this.store.customizerOpen(), requested = this.store.customizerProduct(), rules = this.pricing.rules();
      if (!open || !rules) return;
      untracked(() => {
        if (requested) this.selectedCategory.set(requested.category);
        const options = this.variants();
        if (!options.includes(this.selectedVariant())) this.selectedVariant.set(options[0] ?? '');
        if (requested) {
          const figures: Record<string, number> = { 'cuadro-1-persona': 1, 'cuadro-pareja': 2, 'cuadro-familiar': 3 };
          this.figures.set(figures[requested.id] ?? Math.max(requested.minFigures, this.figures()));
          this.activeStep.set(2);
        } else this.activeStep.set(1);
        this.normalizeSelection();
      });
    });
  }

  private normalizeSelection(): void {
    this.figures.set(Math.max(this.minFigures(), Math.min(this.maxFigures(), this.figures())));
    this.pets.set(Math.min(this.maxPets(), Math.max(0, this.pets())));
    if (!this.selectedProduct()?.allowsAccessories) this.accessories.set(false);
  }
  openCustomizer(category?: Category): void {
    this.store.customizerProduct.set(null);
    if (category) this.chooseCategory(category);
    this.activeStep.set(1); this.store.openCustomizer();
  }
  chooseCategory(category: Category): void {
    this.store.customizerProduct.set(null);
    this.selectedCategory.set(category);
    this.selectedVariant.set(this.variants()[0] ?? '');
    this.normalizeSelection();
  }
  chooseCuadro(product: Product): void { this.store.customizerProduct.set(product); }
  chooseVariant(variant: string): void {
    if (!this.variants().includes(variant)) return;
    this.selectedVariant.set(variant); this.normalizeSelection();
  }
  changeFigures(change: number): void {
    if (change > 0 && !this.canIncreaseFigures()) return;
    this.figures.set(Math.max(this.minFigures(), Math.min(this.maxFigures(), this.figures() + change)));
  }
  changePets(change: number): void { this.pets.set(Math.max(0, Math.min(this.maxPets(), this.pets() + change))); }
  nextStep(): void {
    if (!this.pricing.rules() || !this.selectedProduct() || (this.activeStep() === 2 && !this.canAdd())) return;
    this.activeStep.update((step) => Math.min(3, step + 1));
  }
  previousStep(): void { this.activeStep.update((step) => Math.max(1, step - 1)); }
  addCustom(): void {
    const product = this.selectedProduct();
    if (!product || !this.canAdd()) return;
    this.store.closeCustomizer();
    this.store.add(product, this.notes(), { variant: this.selectedVariant(), figures: this.figures(), pets: this.pets(),
      accessories: this.accessories(), occasion: this.occasion(), estimatedPrice: this.priceQuote().totalPrice });
  }
}
