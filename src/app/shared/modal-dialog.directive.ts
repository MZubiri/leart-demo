import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { AfterViewInit, Directive, ElementRef, inject, Injectable, OnDestroy, output } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalEnvironment {
  private readonly document = inject(DOCUMENT);
  private readonly locks = new Map<HTMLElement, { count: number; original: boolean }>();
  private readonly stack: HTMLElement[] = [];
  private overflow = '';
  private pendingOpener: HTMLElement | null = null;

  isTop(element: HTMLElement): boolean { return this.stack.at(-1) === element; }

  acquire(element: HTMLElement, previous: HTMLElement | null): () => void {
    const opener = this.pendingOpener?.isConnected ? this.pendingOpener : previous;
    this.pendingOpener = null;
    if (!this.stack.length) { this.overflow = this.document.body.style.overflow; this.document.body.style.overflow = 'hidden'; }
    this.stack.push(element);
    const held: HTMLElement[] = [];
    let layer = element.closest<HTMLElement>('[data-modal-layer]') || element;
    while (layer.parentElement && layer !== this.document.body) {
      for (const sibling of Array.from(layer.parentElement.children)) {
        if (sibling === layer || !(sibling instanceof HTMLElement) || ['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) continue;
        const lock = this.locks.get(sibling) || { count: 0, original: !!sibling.inert };
        lock.count++; this.locks.set(sibling, lock); sibling.inert = true; held.push(sibling);
      }
      layer = layer.parentElement;
    }
    return () => {
      for (const sibling of held) {
        const lock = this.locks.get(sibling)!;
        if (--lock.count === 0) { sibling.inert = lock.original; this.locks.delete(sibling); }
      }
      const index = this.stack.indexOf(element); if (index >= 0) this.stack.splice(index, 1);
      if (!this.stack.length) { this.document.body.style.overflow = this.overflow; this.pendingOpener = opener; }
      // Esperar a que CDK y Angular retiren la vista y restauren los elementos de fondo.
      queueMicrotask(() => {
        if (opener?.isConnected && !opener.closest('[inert]') && (!this.stack.length || this.stack.at(-1)!.contains(opener))) opener.focus();
        if (this.pendingOpener === opener) this.pendingOpener = null;
      });
    };
  }
}

@Directive({
  selector: '[leartModal]', standalone: true,
  hostDirectives: [CdkTrapFocus],
  host: { role: 'dialog', 'aria-modal': 'true', tabindex: '-1', '(document:keydown.escape)': 'escape($event)' },
})
export class ModalDialogDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly environment = inject(ModalEnvironment);
  private readonly document = inject(DOCUMENT);
  private readonly previous = this.document.activeElement as HTMLElement | null;
  private readonly trap = inject(CdkTrapFocus);
  private observer?: MutationObserver;
  private release?: () => void;
  readonly modalDismiss = output<void>();
  constructor() { this.trap.autoCapture = true; }
  ngAfterViewInit(): void {
    this.release = this.environment.acquire(this.element, this.previous);
    this.observer = new MutationObserver(() => {
      if (!this.environment.isTop(this.element) || this.element.contains(this.document.activeElement)) return;
      const step = this.element.querySelector<HTMLElement>('[data-step-heading]');
      if (step) step.focus();
      else if (!this.trap.focusTrap?.focusFirstTabbableElement()) this.element.focus();
    });
    this.observer.observe(this.element, { childList: true, subtree: true });
  }
  escape(event: Event): void {
    if (!this.environment.isTop(this.element)) return;
    event.preventDefault(); event.stopPropagation(); this.modalDismiss.emit();
  }
  ngOnDestroy(): void { this.observer?.disconnect(); this.release?.(); }
}
