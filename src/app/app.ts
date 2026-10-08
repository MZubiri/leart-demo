import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SettingsService } from './core/services/settings.service';
import { calculatePrice, formatCop, PriceBreakdown } from './store/pricing';
import { CATEGORY_SHOWCASE, Category, OCCASIONS } from './store/products';
import { StoreService } from './store/store.service';

const VARIANTS: Record<Category, string[]> = {
  Cuadros: [
    'Talla S (20x15 cm) · máx. 3',
    'Talla M (27x22 cm) · máx. 6',
    'Talla L (32x23 cm) · máx. 10',
  ],
  'Sets armables': [
    'Grupo 1',
    'Grupo 2',
    'Grupo 3',
    'Grupo 4',
    'Edición Especial Casita UP',
    'Skyline',
  ],
  'Cajas acrílicas': [
    'Caja Sencilla · máx. 1',
    'Caja Doble · máx. 4',
    'Caja Doble + Moto',
  ],
  'Mini momentos': [
    'Con luz (piezas tipo lego)',
    'Sin luz (piezas tipo lego)',
    'Mini armables compactos',
  ],
  'Mini Box': [
    'Taller de Herramientas',
    'Mini Fitness',
    'Buena Vibra / DJ',
  ],
  Llaveros: [
    'Llavero personalizado',
    'Llavero de jugador',
    'Llavero de personaje',
  ],
  Minifiguras: [
    'Figura individual',
    'Imán decorativo',
  ],
};

const FRAME_LIMITS: Record<string, number> = {
  'Tamaño S · máx. 4': 3,
  'Tamaño M · máx. 6': 6,
  'Tamaño L · máx. 8': 10,
  'Talla S (20x15 cm) · máx. 3': 3,
  'Talla M (27x22 cm) · máx. 6': 6,
  'Talla L (32x23 cm) · máx. 10': 10,
};

const CATEGORY_DEFAULT_LIMITS: Record<Category, number> = {
  Cuadros: 3,
  'Sets armables': 8,
  'Cajas acrílicas': 4,
  'Mini momentos': 6,
  'Mini Box': 4,
  Llaveros: 1,
  Minifiguras: 8,
};

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
  readonly store = inject(StoreService);

  readonly settings = this.settingsService.settings;
  readonly currentUrl = signal(this.router.url);
  readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  readonly formats = CATEGORY_SHOWCASE;
  readonly occasions = OCCASIONS;
  readonly menuOpen = signal(false);
  readonly activeStep = signal(1);
  readonly selectedCategory = signal<Category>('Cuadros');
  readonly selectedVariant = signal('Talla S (20x15 cm) · máx. 3');
  readonly figures = signal(2);
  readonly pets = signal(0);
  readonly accessories = signal(false);
  readonly occasion = signal('Aniversario');
  readonly notes = signal('');

  readonly variants = computed(() => {
    const requested = this.store.customizerProduct();
    return requested?.category === this.selectedCategory() && requested.variants.length > 0
      ? requested.variants
      : VARIANTS[this.selectedCategory()];
  });

  readonly maxFigures = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Cuadros') {
      return FRAME_LIMITS[this.selectedVariant()] ?? 3;
    }
    if (cat === 'Cajas acrílicas') {
      const v = this.selectedVariant();
      if (v.includes('Sencilla') || v.includes('máx. 1')) return 1;
      if (v.includes('+ Moto')) return 2;
      return 4;
    }
    if (cat === 'Llaveros') return 1;
    return this.formats.find((item) => item.name === cat)?.maxFigures ?? CATEGORY_DEFAULT_LIMITS[cat] ?? 8;
  });

  readonly capacityUsed = computed(() => this.figures() + this.pets());
  readonly remainingCapacity = computed(() => Math.max(0, this.maxFigures() - this.capacityUsed()));

  readonly selectedProduct = computed(() => {
    const requested = this.store.customizerProduct();
    return requested?.category === this.selectedCategory()
      ? requested
      : this.store.products.find((item) => item.category === this.selectedCategory());
  });

  readonly priceQuote = computed<PriceBreakdown>(() =>
    calculatePrice({
      category: this.selectedCategory(),
      variant: this.selectedVariant(),
      figures: this.figures(),
      pets: this.pets(),
      accessories: this.accessories(),
      product: this.selectedProduct(),
    })
  );

  readonly formattedEstimatedPrice = computed(() => formatCop(this.priceQuote().totalPrice));

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });

    effect(() => {
      const isOpen = this.store.customizerOpen();
      const requested = this.store.customizerProduct();
      if (!isOpen) return;
      if (!requested) {
        this.activeStep.set(1);
        return;
      }
      this.selectedCategory.set(requested.category);
      this.selectedVariant.set(requested.variants[0] || VARIANTS[requested.category][0]);
      const maximum =
        requested.category === 'Cuadros' ? FRAME_LIMITS[requested.variants[0]] ?? 3 : requested.maxFigures;
      const figures = Math.min(Math.max(untracked(this.figures), requested.minFigures), maximum);
      this.figures.set(figures);
      this.pets.set(Math.min(untracked(this.pets), Math.max(0, maximum - figures)));
      this.activeStep.set(2);
    });
  }

  openCustomizer(category?: Category): void {
    this.store.customizerProduct.set(null);
    if (category) this.chooseCategory(category);
    this.activeStep.set(1);
    this.store.openCustomizer();
  }

  chooseCategory(category: Category): void {
    this.store.customizerProduct.set(null);
    this.selectedCategory.set(category);
    this.selectedVariant.set(VARIANTS[category][0]);
    const maximum =
      category === 'Cuadros'
        ? 3
        : this.formats.find((item) => item.name === category)?.maxFigures ?? CATEGORY_DEFAULT_LIMITS[category] ?? 8;
    this.figures.set(Math.min(Math.max(1, this.figures()), maximum));
    this.pets.set(Math.min(this.pets(), Math.max(0, maximum - this.figures())));
    if (category === 'Llaveros') {
      this.figures.set(1);
      this.pets.set(0);
    }
  }

  chooseVariant(variant: string): void {
    this.selectedVariant.set(variant);
    const maximum =
      this.selectedCategory() === 'Cuadros'
        ? FRAME_LIMITS[variant] ?? 3
        : this.selectedCategory() === 'Cajas acrílicas'
        ? variant.includes('Sencilla')
          ? 1
          : variant.includes('+ Moto')
          ? 2
          : 4
        : this.formats.find((item) => item.name === this.selectedCategory())?.maxFigures ?? 8;

    this.figures.set(Math.min(Math.max(1, this.figures()), maximum));
    this.pets.set(Math.min(this.pets(), Math.max(0, maximum - this.figures())));
  }

  changeFigures(change: number): void {
    const availableForFigures = this.maxFigures() - this.pets();
    this.figures.set(Math.max(1, Math.min(availableForFigures, this.figures() + change)));
  }

  changePets(change: number): void {
    if (this.selectedCategory() === 'Llaveros' || this.selectedCategory() === 'Minifiguras') return;
    const availableForPets = this.maxFigures() - this.figures();
    this.pets.set(Math.max(0, Math.min(availableForPets, this.pets() + change)));
  }

  nextStep(): void {
    this.activeStep.update((step) => Math.min(3, step + 1));
  }

  previousStep(): void {
    this.activeStep.update((step) => Math.max(1, step - 1));
  }

  addCustom(): void {
    const product = this.selectedProduct() ?? this.store.products[0];
    const extras = [
      this.pets() ? `${this.pets()} mascota(s)` : '',
      this.accessories() ? 'con accesorios' : '',
    ]
      .filter(Boolean)
      .join(', ');

    const priceText = `Estimado: ${this.formattedEstimatedPrice()}`;

    const note = [
      `${this.selectedVariant()}, ${this.figures()} minifigura(s)`,
      extras,
      priceText,
      this.occasion(),
      this.notes(),
    ]
      .filter(Boolean)
      .join(' · ');

    this.store.closeCustomizer();
    this.store.add(product, note);
  }
}
