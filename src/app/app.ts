import { CommonModule } from '@angular/common';
import { Component, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FIGURE_STYLES, FORMATS, SCENES } from './store/products';
import { StoreService } from './store/store.service';

@Component({
  selector:'app-root',
  imports:[CommonModule,FormsModule,RouterOutlet,RouterLink,RouterLinkActive],
  templateUrl:'./app.html',
  styleUrl:'./app.scss',
  encapsulation:ViewEncapsulation.None
})
export class App {
  readonly formats=FORMATS; readonly figureStyles=FIGURE_STYLES; readonly scenes=SCENES;
  readonly menuOpen=signal(false); readonly activeStep=signal(1);
  readonly selectedProduct=signal('Set armable'); readonly selectedFigure=signal('Pareja'); readonly selectedScene=signal('Parque');
  readonly people=signal(2); readonly occasion=signal('Aniversario'); readonly notes=signal(''); readonly photoPreviews=signal<string[]>([]);
  constructor(readonly store:StoreService){}
  openCustomizer(){this.activeStep.set(1);this.store.openCustomizer();}
  nextStep(){this.activeStep.update(step=>Math.min(3,step+1));}
  previousStep(){this.activeStep.update(step=>Math.max(1,step-1));}
  onPhotos(event:Event){const files=Array.from((event.target as HTMLInputElement).files||[]).slice(0,4);Promise.all(files.map(file=>new Promise<string>(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(file);}))).then(images=>this.photoPreviews.set(images));}
  addCustom(){const category=this.selectedProduct()==='Minibox'?'Minibox':this.selectedProduct()==='Solo minifiguras'?'Minifiguras':'Sets armables';const product=this.store.products.find(item=>item.category===category)||this.store.products[0];const note=`Personalizado: ${this.selectedFigure()}, escena ${this.selectedScene()}, ${this.people()} figura(s), ${this.occasion()}. ${this.notes()}`.trim();this.store.closeCustomizer();this.store.add(product,note);}
}
