import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORY_SHOWCASE } from '../store/products';

@Component({
  selector: 'app-personalization-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './personalization.page.html',
})
export class PersonalizationPage {
  readonly categories = CATEGORY_SHOWCASE;
  readonly order = signal('');
  readonly name = signal('');
  readonly phone = signal('');
  readonly product = signal('');
  readonly people = signal('');
  readonly story = signal('');
  readonly phrase = signal('');
  readonly requirements = signal('');
  readonly photoNames = signal<string[]>([]);
  readonly ready = computed(() => Boolean(this.order().trim() && this.name().trim() && this.product()));
  readonly whatsappUrl = computed(() => {
    const message = [
      'Hola Leart 👋 Ya realicé mi pedido y quiero completar la información de personalización.',
      '',
      `Pedido o referencia: ${this.order()}`,
      `Nombre: ${this.name()}`,
      `Teléfono: ${this.phone()}`,
      `Producto: ${this.product()}`,
      `Personas o mascotas: ${this.people()}`,
      `Historia u ocasión: ${this.story()}`,
      `Nombres, fecha o frase: ${this.phrase()}`,
      `Requerimientos especiales: ${this.requirements()}`,
      '',
      this.photoNames().length
        ? `Tengo ${this.photoNames().length} foto(s) de referencia para adjuntar en este chat.`
        : 'Aún no he seleccionado fotos de referencia.',
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  });

  onPhotos(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []).slice(0, 6);
    this.photoNames.set(files.map((file) => file.name));
  }
}
