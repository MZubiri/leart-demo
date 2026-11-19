import { computed, Directive, input } from '@angular/core';
import manifest from '../../generated/image-manifest.json';
interface ImageAsset { hash: string; width: number; height: number; widths: number[]; }
const images: Record<string, ImageAsset> = manifest;

@Directive({
  selector: 'img[leartImage]',
  standalone: true,
  host: {
    '[attr.src]': 'source().src', '[attr.srcset]': 'source().srcset', '[attr.sizes]': 'imageSizes()',
    '[attr.width]': 'source().width', '[attr.height]': 'source().height',
    '[attr.loading]': 'imagePriority() ? "eager" : "lazy"',
    '[attr.fetchpriority]': 'imagePriority() ? "high" : "auto"', '[attr.decoding]': '"async"',
  },
})
export class OptimizedImageDirective {
  readonly leartImage = input.required<string>();
  readonly imagePriority = input(false);
  readonly imageSizes = input('(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 360px');
  readonly source = computed(() => {
    const original = this.leartImage(), asset = images[original];
    if (!asset) return { src: original, srcset: null, width: null, height: null };
    const url = (width: number) => '/optimized' + original.replace(/\.[^/.]+$/, '') + '.' + asset.hash + '.' + width + '.webp';
    const width = asset.widths.find(value => value >= 640) || asset.widths.at(-1)!;
    return { src: url(width), srcset: asset.widths.map(value => `${url(value)} ${value}w`).join(', '), width, height: Math.round(asset.height * width / asset.width) };
  });
}
