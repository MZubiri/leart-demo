import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, UpdateSettingsRequest } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1>Configuración de Tienda y WhatsApp</h1>
          <p>Modifica el número oficial de WhatsApp y los textos globales que ven los clientes.</p>
        </div>
      </div>

      @if (savedNotification()) {
        <div class="notification-toast">
          <span>✓</span>
          <span>¡Configuración guardada exitosamente! El número de WhatsApp está actualizado en toda la tienda.</span>
        </div>
      }

      @if (errorMessage()) {
        <div class="error-banner">
          <span>⚠️</span>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <div class="settings-card">
        <form (ngSubmit)="saveSettings()" class="settings-form">
          <!-- WhatsApp Section Highlight -->
          <div class="section-box whatsapp-box">
            <div class="section-badge">Canal Principal</div>
            <div class="section-title">
              <span class="icon">📱</span>
              <div>
                <h2>Número Oficial de WhatsApp</h2>
                <p>Todos los botones "Cotizar", "Enviar por WhatsApp" y enlaces de la web usarán este número.</p>
              </div>
            </div>

            <div class="field-row">
              <div class="field-group flex-2">
                <label for="waNumber">Número con indicativo de país (ej. Colombia 57)</label>
                <div class="input-with-prefix">
                  <span class="prefix">+</span>
                  <input
                    id="waNumber"
                    type="text"
                    name="whatsAppNumber"
                    placeholder="573001234567"
                    required
                    [ngModel]="whatsAppNumber()"
                    (ngModelChange)="onWhatsAppChange($event)"
                  />
                </div>
                <small class="helper-text">
                  Ingresa únicamente números, sin espacios ni guiones. Ejemplo para Medellín/Colombia: <code>573001234567</code>.
                </small>
              </div>

              <div class="field-group flex-1 test-container">
                <label>Verificación en vivo</label>
                <a
                  [href]="'https://wa.me/' + cleanNumber()"
                  target="_blank"
                  class="test-button"
                  [class.disabled]="!cleanNumber()"
                >
                  <span>Abrir chat de prueba ↗</span>
                </a>
              </div>
            </div>
          </div>

          <!-- General Store Details -->
          <div class="section-box">
            <div class="section-title">
              <span class="icon">🏷️</span>
              <div>
                <h2>Identidad de la Tienda</h2>
                <p>Información básica y barra de anuncios.</p>
              </div>
            </div>

            <div class="form-grid">
              <div class="field-group">
                <label for="storeName">Nombre de la Tienda</label>
                <input
                  id="storeName"
                  type="text"
                  name="storeName"
                  [ngModel]="storeName()"
                  (ngModelChange)="storeName.set($event)"
                />
              </div>

              <div class="field-group">
                <label for="announcement">Texto de la Barra Superior de Anuncios</label>
                <input
                  id="announcement"
                  type="text"
                  name="announcementText"
                  placeholder="Hecho en Medellín · Envíos a toda Colombia"
                  [ngModel]="announcementText()"
                  (ngModelChange)="announcementText.set($event)"
                />
              </div>

              <div class="field-group full-width">
                <label for="instagram">Enlace Oficial de Instagram</label>
                <input
                  id="instagram"
                  type="url"
                  name="instagramUrl"
                  placeholder="https://www.instagram.com/leart.store/"
                  [ngModel]="instagramUrl()"
                  (ngModelChange)="instagramUrl.set($event)"
                />
              </div>
            </div>
          </div>

          <!-- WhatsApp Message Templates -->
          <div class="section-box">
            <div class="section-title">
              <span class="icon">💬</span>
              <div>
                <h2>Plantillas de Mensajes de WhatsApp</h2>
                <p>Encabezados automáticos generados cuando el cliente abre WhatsApp desde la web.</p>
              </div>
            </div>

            <div class="form-grid">
              <div class="field-group full-width">
                <label for="quoteTemplate">Saludo de Cotización Inicial</label>
                <input
                  id="quoteTemplate"
                  type="text"
                  name="quoteTemplate"
                  [ngModel]="quoteTemplate()"
                  (ngModelChange)="quoteTemplate.set($event)"
                />
              </div>

              <div class="field-group full-width">
                <label for="personalizationTemplate">Mensaje al enviar Personalización Post-pago</label>
                <input
                  id="personalizationTemplate"
                  type="text"
                  name="personalizationTemplate"
                  [ngModel]="personalizationTemplate()"
                  (ngModelChange)="personalizationTemplate.set($event)"
                />
              </div>
            </div>
          </div>

          <!-- Save Button Bar -->
          <div class="actions-bar">
            <button type="submit" [disabled]="saving()" class="btn-save">
              @if (saving()) {
                <span>Guardando cambios...</span>
              } @else {
                <span>💾 Guardar Configuración</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Security Section: Change Password -->
      <div class="settings-card" style="margin-top: 1.5rem;">
        <div class="settings-form">
          <div class="section-box">
            <div class="section-title">
              <span class="icon">🔒</span>
              <div>
                <h2>Seguridad de la Cuenta</h2>
                <p>Cambia la contraseña de acceso al Panel de Administración.</p>
              </div>
            </div>

            @if (passwordNotification()) {
              <div class="notification-toast" style="margin: 1rem 0;">
                <span>✓</span>
                <span>¡Contraseña actualizada exitosamente!</span>
              </div>
            }

            @if (passwordError()) {
              <div class="error-banner" style="margin: 1rem 0;">
                <span>⚠️</span>
                <span>{{ passwordError() }}</span>
              </div>
            }

            <form (ngSubmit)="submitPasswordChange()" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
              <div class="form-grid">
                <div class="field-group">
                  <label for="currentPassword">Contraseña Actual</label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    required
                    [ngModel]="currentPassword()"
                    (ngModelChange)="currentPassword.set($event)"
                    placeholder="••••••••"
                  />
                </div>
                <div class="field-group">
                  <label for="newPassword">Nueva Contraseña (mínimo 8 caracteres)</label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    required
                    [ngModel]="newPassword()"
                    (ngModelChange)="newPassword.set($event)"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                <button type="submit" [disabled]="changingPassword()" class="btn-save" style="background: #374151;">
                  @if (changingPassword()) {
                    <span>Actualizando...</span>
                  } @else {
                    <span>🔐 Actualizar Contraseña</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .page-header p {
      color: #6b7280;
      font-size: 0.95rem;
    }
    .notification-toast {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.92rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
      animation: fadeIn 0.25s ease;
    }
    .notification-toast span:first-child {
      background: #10b981;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.85rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .settings-card {
      background: #ffffff;
      border-radius: 1rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      overflow: hidden;
    }
    .settings-form {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .section-box {
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      background: #fafbfc;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;
    }
    .section-box.whatsapp-box {
      background: linear-gradient(to bottom right, #ffffff, #f0fdf4);
      border-color: #86efac;
      border-width: 2px;
    }
    .section-badge {
      position: absolute;
      top: -11px;
      right: 20px;
      background: #059669;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
    }
    .section-title {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .section-title .icon {
      font-size: 1.5rem;
    }
    .section-title h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.2rem;
    }
    .section-title p {
      color: #6b7280;
      font-size: 0.85rem;
    }
    .field-row {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }
    .flex-2 { flex: 2; }
    .flex-1 { flex: 1; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .field-group label {
      font-size: 0.83rem;
      font-weight: 600;
      color: #374151;
    }
    .input-with-prefix {
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .input-with-prefix:focus-within {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .input-with-prefix .prefix {
      padding: 0 0.85rem;
      color: #6b7280;
      font-weight: 700;
      font-size: 1.1rem;
      background: #f3f4f6;
      border-right: 1px solid #e5e7eb;
      height: 100%;
      display: flex;
      align-items: center;
      user-select: none;
    }
    .input-with-prefix input {
      border: none !important;
      box-shadow: none !important;
      padding: 0.75rem 0.9rem;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      width: 100%;
    }
    .field-group input[type="text"],
    .field-group input[type="url"] {
      padding: 0.75rem 0.9rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.92rem;
      background: #ffffff;
      transition: border-color 0.15s;
    }
    .field-group input:focus {
      outline: none;
      border-color: #0f1419;
      box-shadow: 0 0 0 3px rgba(15, 20, 25, 0.08);
    }
    .helper-text {
      color: #6b7280;
      font-size: 0.75rem;
    }
    .helper-text code {
      background: #f3f4f6;
      padding: 0.15rem 0.35rem;
      border-radius: 0.25rem;
      font-weight: 600;
      color: #059669;
    }
    .test-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .test-button {
      padding: 0.78rem 1rem;
      background: #25d366;
      color: #ffffff;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.88rem;
      text-decoration: none;
      text-align: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);
      transition: opacity 0.15s, transform 0.1s;
    }
    .test-button:hover:not(.disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .test-button.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .actions-bar {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
    .btn-save {
      background: #0f1419;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
      padding: 0.85rem 2rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-save:hover:not(:disabled) {
      background: #232d36;
      transform: translateY(-1px);
    }
    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .field-row, .form-grid { flex-direction: column; grid-template-columns: 1fr; }
    }
  `],
})
export class AdminSettingsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly publicSettings = inject(SettingsService);
  private readonly auth = inject(AuthService);

  readonly storeName = signal('Leart Store');
  readonly whatsAppNumber = signal('573000000000');
  readonly cleanNumber = signal('573000000000');
  readonly announcementText = signal('Hecho en Medellín · Envíos a toda Colombia');
  readonly instagramUrl = signal('https://www.instagram.com/leart.store/');
  readonly quoteTemplate = signal('Hola Leart 👋 Quiero cotizar esta selección:');
  readonly personalizationTemplate = signal('Hola Leart 👋 Ya realicé mi pedido y quiero completar la información de personalización.');

  readonly saving = signal(false);
  readonly savedNotification = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.admin.getSettings().subscribe({
      next: (s) => {
        this.storeName.set(s.storeName);
        this.whatsAppNumber.set(s.whatsAppNumber);
        this.cleanNumber.set(s.whatsAppNumber.replace(/\D/g, ''));
        this.announcementText.set(s.announcementText);
        this.instagramUrl.set(s.instagramUrl);
        this.quoteTemplate.set(s.whatsAppQuoteTemplate);
        this.personalizationTemplate.set(s.whatsAppPersonalizationTemplate);
      },
      error: (err) => {
        this.errorMessage.set('No se pudo cargar la configuración del servidor.');
      },
    });
  }

  onWhatsAppChange(val: string): void {
    this.whatsAppNumber.set(val);
    this.cleanNumber.set(val.replace(/\D/g, ''));
  }

  saveSettings(): void {
    const rawNumber = this.cleanNumber();
    if (!rawNumber || rawNumber.length < 8) {
      this.errorMessage.set('Por favor ingresa un número de WhatsApp válido con código de país (ej: 573001234567).');
      return;
    }

    this.saving.set(true);
    this.savedNotification.set(false);
    this.errorMessage.set('');

    const payload: UpdateSettingsRequest = {
      storeName: this.storeName().trim(),
      whatsAppNumber: rawNumber,
      announcementText: this.announcementText().trim(),
      instagramUrl: this.instagramUrl().trim(),
      whatsAppQuoteTemplate: this.quoteTemplate().trim(),
      whatsAppPersonalizationTemplate: this.personalizationTemplate().trim(),
    };

    this.admin.updateSettings(payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.savedNotification.set(true);
        // Refresh global client settings so whole frontend reflects changes immediately
        this.publicSettings.fetchSettings();

        setTimeout(() => this.savedNotification.set(false), 5000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al guardar la configuración.');
      },
    });
  }

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly changingPassword = signal(false);
  readonly passwordNotification = signal(false);
  readonly passwordError = signal('');

  submitPasswordChange(): void {
    if (!this.currentPassword() || !this.newPassword()) {
      this.passwordError.set('Por favor completa ambos campos de contraseña.');
      return;
    }

    if (this.newPassword().length < 8) {
      this.passwordError.set('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.changingPassword.set(true);
    this.passwordNotification.set(false);
    this.passwordError.set('');

    this.auth.changePassword({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword()
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordNotification.set(true);
        this.currentPassword.set('');
        this.newPassword.set('');
        setTimeout(() => this.passwordNotification.set(false), 5000);
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.passwordError.set(err?.error?.message || 'Error al actualizar la contraseña.');
      }
    });
  }
}

