import { CommonModule } from '@angular/common';
import { Component, computed, signal, ViewEncapsulation } from '@angular/core';
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
  readonly variants = computed(() => VARIANTS[this.selectedCategory()]);
  readonly maxFigures = computed(() =>
    this.selectedCategory() === 'Cuadros'
      ? FRAME_LIMITS[this.selectedVariant()] ?? 4
      : this.formats.find((item) => item.name === this.selectedCategory())?.maxFigures ?? 8,
  );
  readonly selectedProduct = computed(
    () => this.store.products.find((item) => item.category === this.selectedCategory()),
  );

  constructor(readonly store: StoreService) {}

  openCustomizer(category?: Category): void {
    if (category) this.chooseCategory(category);
    this.activeStep.set(1);
    this.store.openCustomizer();
  }

  chooseCategory(category: Category): void {
    this.selectedCategory.set(category);
    this.selectedVariant.set(VARIANTS[category][0]);
    const maximum = category === 'Cuadros' ? 4 : this.formats.find((item) => item.name === category)?.maxFigures ?? 8;
    this.figures.set(Math.min(this.figures(), maximum));
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
  }

  changeFigures(change: number): void {
    this.figures.set(Math.max(1, Math.min(this.maxFigures(), this.figures() + change)));
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
