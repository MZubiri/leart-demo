import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalDialogDirective } from './modal-dialog.directive';
@Component({ standalone: true, imports: [ModalDialogDirective], template: `
  <button id="origin" (click)="open.set(true)">Abrir</button>
  @if (open()) { <div data-modal-layer><section leartModal aria-label="Principal" (modalDismiss)="open.set(false)"><button id="nested-origin" (click)="nested.set(true)">Otro</button><button>Cerrar</button></section></div> }
  @if (nested()) { <div data-modal-layer><section leartModal aria-label="Anidado" (modalDismiss)="nested.set(false)"><button>Salir</button></section></div> }
` })
class ModalHost { readonly open = signal(false); readonly nested = signal(false); }
describe('Modal lifecycle', () => {
  afterEach(() => { document.body.style.overflow = ''; });
  it('makes background inert, restores scroll and focus, and dismisses only the top dialog', async () => {
    TestBed.configureTestingModule({ imports: [ModalHost] });
    const fixture = TestBed.createComponent(ModalHost); fixture.detectChanges();
    const origin = fixture.nativeElement.querySelector('#origin') as HTMLButtonElement;
    document.body.style.overflow = 'clip'; origin.focus(); origin.click(); await fixture.whenStable();
    expect(origin.inert).toBe(true); expect(document.body.style.overflow).toBe('hidden');
    const nestedOrigin = fixture.nativeElement.querySelector('#nested-origin') as HTMLButtonElement;
    nestedOrigin.focus(); nestedOrigin.click(); await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await fixture.whenStable();
    expect(fixture.componentInstance.nested()).toBe(false); expect(fixture.componentInstance.open()).toBe(true);
    expect(document.body.style.overflow).toBe('hidden'); expect(document.activeElement).toBe(nestedOrigin);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false); expect(origin.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('clip'); expect(document.activeElement).toBe(origin);
  });
});
