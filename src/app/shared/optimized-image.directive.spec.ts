import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OptimizedImageDirective } from './optimized-image.directive';
@Component({ standalone: true, imports: [OptimizedImageDirective], template: '<img [leartImage]="source()" [imagePriority]="priority()" alt="Producto">' })
class ImageHost { readonly source = signal('/images/cuadro-personalizado.png'); readonly priority = signal(false); }
describe('Responsive bundled images', () => {
  it('reserves dimensions, supplies WebP variants and keeps uploaded URLs intact', () => {
    TestBed.configureTestingModule({ imports: [ImageHost] });
    const fixture = TestBed.createComponent(ImageHost); fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('/optimized/images/cuadro-personalizado.');
    expect(img.getAttribute('srcset')).toContain('320w'); expect(img.getAttribute('loading')).toBe('lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0); expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
    fixture.componentInstance.priority.set(true); fixture.detectChanges();
    expect(img.getAttribute('loading')).toBe('eager'); expect(img.getAttribute('fetchpriority')).toBe('high');
    fixture.componentInstance.source.set('/uploads/products/custom.png'); fixture.detectChanges();
    expect(img.getAttribute('src')).toBe('/uploads/products/custom.png'); expect(img.getAttribute('srcset')).toBeNull();
  });
});
