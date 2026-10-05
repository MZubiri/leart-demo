import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { SettingsService } from '../core/services/settings.service';
import { CATEGORY_SHOWCASE } from '../store/products';

@Component({
  selector: 'app-personalization-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './personalization.page.html',
})
export class PersonalizationPage {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);

  readonly categories = CATEGORY_SHOWCASE;
  readonly order = signal('');
  readonly name = signal('');
  readonly phone = signal('');
  readonly product = signal('');
  readonly people = signal('');
  readonly story = signal('');
  readonly phrase = signal('');
  readonly requirements = signal('');
  readonly selectedFiles = signal<File[]>([]);
  readonly photoNames = signal<string[]>([]);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submittedReference = signal('');
  readonly errorMessage = signal('');

  readonly ready = computed(() => Boolean(this.order().trim() && this.name().trim() && this.product()));

  readonly whatsappUrl = computed(() => {
    const ref = this.submittedReference() || this.order();
    const message = [
      'Hola Leart 👋 Ya completé la información de personalización en la web.',
      '',
      `Pedido o referencia: ${ref}`,
      `Nombre: ${this.name()}`,
      `Teléfono: ${this.phone()}`,
      `Producto: ${this.product()}`,
      `Personas o mascotas: ${this.people()}`,
      `Historia u ocasión: ${this.story()}`,
      `Nombres, fecha o frase: ${this.phrase()}`,
      `Requerimientos especiales: ${this.requirements()}`,
      '',
      this.photoNames().length
        ? `Adjunté ${this.photoNames().length} foto(s) de referencia en el formulario.`
        : 'Aún no he seleccionado fotos de referencia.',
    ].join('\n');

    return this.settingsService.buildWhatsAppUrl(message);
  });

  onPhotos(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []).slice(0, 6);
    this.selectedFiles.set(files);
    this.photoNames.set(files.map((file) => file.name));
  }

  submitOrder(): void {
    if (!this.ready()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('orderReference', this.order().trim());
    formData.append('customerName', this.name().trim());
    formData.append('phone', this.phone().trim());
    formData.append('productTitle', this.product());
    formData.append('peopleDetails', this.people().trim());
    formData.append('story', this.story().trim());
    formData.append('phrase', this.phrase().trim());
    formData.append('requirements', this.requirements().trim());

    for (const file of this.selectedFiles()) {
      formData.append('photos', file, file.name);
    }

    this.http.post<{ orderReference: string }>(`${environment.apiUrl}/public/personalization`, formData).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.submittedReference.set(res.orderReference);
      },
      error: (err) => {
        this.submitting.set(false);
        // Fallback: If backend is unreachable, still allow customer to proceed to WhatsApp
        this.submitted.set(true);
        this.submittedReference.set(this.order().trim());
      },
    });
  }
}
