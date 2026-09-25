import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CATEGORY_SHOWCASE, Category, OCCASIONS } from './store/products';
import { StoreService } from './store/store.service';

const VARIANTS: Record<Category, string[]> = {
  Cuadros: ['Tamaño S · máx. 4', 'Tamaño M · máx. 6', 'Tamaño L · máx. 8'],
  'Sets armables': ['Grupo 1', 'Grupo 2', 'Grupo 3'],
  'Cajas acrílicas': ['Caja con fondo', 'Caja con mini set'],
  Llaveros: ['Llavero individual'],
  Minifiguras: ['Figura individual', 'Imán'],
};

const FRAME_LIMITS: Record<string, number> = {
  'Tamaño S · máx. 4': 4,
  'Tamaño M · máx. 6': 6,
  'Tamaño L · máx. 8': 8,
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  readonly formats = CATEGORY_SHOWCASE;
  readonly occasions = OCCASIONS;
  readonly menuOpen = signal(false);
  readonly activeStep = signal(1);
  readonly selectedCategory = signal<Category>('Cuadros');
  readonly selectedVariant = signal('Tamaño S · máx. 4');
  readonly figures = signal(2);
  readonly pets = signal(0);
  readonly accessories = signal(false);
  readonly occasion = signal('Aniversario');
  readonly notes = signal('');
  readonly variants = computed(() => {
    const requested = this.store.customizerProduct();
    return requested?.category === this.selectedCategory() ? requested.variants : VARIANTS[this.selectedCategory()];
  });
  readonly maxFigures = computed(() =>
    this.selectedCategory() === 'Cuadros'
      ? FRAME_LIMITS[this.selectedVariant()] ?? 4
      : this.formats.find((item) => item.name === this.selectedCategory())?.maxFigures ?? 8,
  );
  readonly capacityUsed = computed(() => this.figures() + this.pets());
  readonly remainingCapacity = computed(() => Math.max(0, this.maxFigures() - this.capacityUsed()));
  readonly selectedProduct = computed(() => {
    const requested = this.store.customizerProduct();
    return requested?.category === this.selectedCategory()
      ? requested
      : this.store.products.find((item) => item.category === this.selectedCategory());
  });

  constructor(readonly store: StoreService) {
    effect(() => {
      const isOpen = this.store.customizerOpen();
      const requested = this.store.customizerProduct();
      if (!isOpen) return;
      if (!requested) {
        this.activeStep.set(1);
        return;
      }
      this.selectedCategory.set(requested.category);
      this.selectedVariant.set(requested.variants[0]);
      const maximum = requested.category === 'Cuadros'
        ? FRAME_LIMITS[requested.variants[0]] ?? 4
        : requested.maxFigures;
      this.figures.set(Math.min(Math.max(this.figures(), requested.minFigures), maximum));
      this.pets.set(Math.min(this.pets(), Math.max(0, maximum - this.figures())));
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
    const maximum = category === 'Cuadros' ? 4 : this.formats.find((item) => item.name === category)?.maxFigures ?? 8;
    this.figures.set(Math.min(this.figures(), maximum));
    this.pets.set(Math.min(this.pets(), Math.max(0, maximum - this.figures())));
    if (category === 'Llaveros') {
      this.figures.set(1);
      this.pets.set(0);
    }
  }

  chooseVariant(variant: string): void {
    this.selectedVariant.set(variant);
    const maximum = this.selectedCategory() === 'Cuadros'
      ? FRAME_LIMITS[variant] ?? 4
      : this.formats.find((item) => item.name === this.selectedCategory())?.maxFigures ?? 8;
    this.figures.set(Math.min(this.figures(), maximum));
    this.pets.set(Math.min(this.pets(), Math.max(0, maximum - this.figures())));
  }

  changeFigures(change: number): void {
    const availableForFigures = this.maxFigures() - this.pets();
    this.figures.set(Math.max(1, Math.min(availableForFigures, this.figures() + change)));
  }

  changePets(change: number): void {
    if (this.selectedCategory() === 'Llaveros') return;
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
    ].filter(Boolean).join(', ');
    const note = [
      `${this.selectedVariant()}, ${this.figures()} minifigura(s)`,
      extras,
      this.occasion(),
      this.notes(),
    ].filter(Boolean).join(' · ');
    this.store.closeCustomizer();
    this.store.add(product, note);
  }
}
