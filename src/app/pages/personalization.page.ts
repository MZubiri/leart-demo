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
  readonly receivedPhotos = signal(0);

  readonly ready = computed(() => Boolean(this.order().trim() && this.name().trim() && this.phone().trim() && this.product()));

  readonly whatsappUrl = computed(() => {
    const ref = this.submittedReference() || this.order();
    const message = [
      this.submitted() ? 'Hola Leart 👋 Mi personalización quedó registrada en la web.' : 'Hola Leart 👋 Necesito ayuda para enviar mi personalización. Su registro todavía no está confirmado.',
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
      this.submitted()
        ? `Fotos recibidas por la web: ${this.receivedPhotos()}.`
        : `Tengo ${this.photoNames().length} foto(s) que necesito enviar con mi pedido.`,
    ].join('\n');

    return this.settingsService.buildWhatsAppUrl(message);
  });

  onPhotos(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []).slice(0, 6);
    this.selectedFiles.set(files);
    this.photoNames.set(files.map((file) => file.name));
  }

  submitOrder(): void {
    if (!this.ready() || this.submitting() || this.submitted()) return;

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

    this.http.post<{ orderReference: string; attachments?: unknown[] }>(`${environment.apiUrl}/public/personalization`, formData).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (!res || typeof res.orderReference !== 'string' || !res.orderReference.trim()) {
          this.errorMessage.set('No se pudo confirmar la recepción. Consulta con tu asesor antes de reenviar.');
          return;
        }
        this.receivedPhotos.set(res.attachments?.length ?? 0);
        this.submitted.set(true);
        this.submittedReference.set(res.orderReference);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitted.set(false);
        this.submittedReference.set('');
        this.errorMessage.set(err.status === 0
          ? 'No se pudo confirmar el envío. Revisa tu conexión o consulta con tu asesor antes de reenviar.'
          : err.status === 429 ? 'Has enviado varias solicitudes. Espera antes de reintentar.'
          : err.error?.message || err.error?.title || 'No se pudo guardar tu información. Revisa los datos y vuelve a intentarlo.');
      },
    });
  }
}
