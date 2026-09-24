export type Category = 'Sets armables' | 'Minibox' | 'Minifiguras';

export interface Product {
  id: string;
  name: string;
  kicker: string;
  category: Category;
  detail: string;
  image: string;
  tag?: string;
  group?: string;
  occasion: string[];
  description: string;
}

const SETS = '/catalog-assets/sets/';
const FIGS = '/catalog-assets/minifiguras/';
const BOX = '/catalog-assets/minibox/';

const set = (id:string,name:string,kicker:string,detail:string,image:string,group='Grupo 1',occasion=['Pareja','Cumpleaños']):Product => ({ id,name,kicker,category:'Sets armables',detail,image:SETS+image,tag:group,group,occasion,description:`${name} es un set armable decorativo que puede incluir minifiguras personalizadas para convertir a esa persona especial en protagonista de la escena. La disponibilidad de piezas, accesorios y figuras se confirma antes de producir.` });
const figure = (id:string,name:string,image:string,occasion=['Coleccionistas','Cumpleaños']):Product => ({ id,name,kicker:'Personajes disponibles',category:'Minifiguras',detail:'Consulta inventario',image:FIGS+image,tag:'Colección',occasion,description:'Colección de minifiguras disponibles para combinar rostros, cabello, outfits y accesorios según inventario. También pueden incorporarse a cuadros, cajas y sets armables.' });

export const PRODUCTS: Product[] = [
  set('set-otono','Cita en otoño','Escena para personalizar','99 piezas','0012f611-7622-45c5-bc55-fef41e6442dc.png','Grupo 3',['Pareja','Aniversario']),
  set('set-foto','Set fotografía','Para quienes capturan momentos','167 piezas','003c24d6-8918-4aec-8583-c4f59a045131.png','Grupo 3',['Profesiones','Graduación']),
  set('set-parque','Mini parque','Un rincón para dos','60 piezas','0ea7c0ee-26b7-4829-a278-1f271e68a988.png','Grupo 1',['Pareja','Aniversario']),
  set('set-mercado','Puesto de mercado','Escena urbana','Set personalizable','18f2f123-6c81-4c34-9c59-fb4d7074492d.png','Grupo 2',['Profesiones','Cumpleaños']),
  set('set-futbol','Cancha de fútbol','Para hinchas de verdad','20 piezas','1a75b290-9657-4c33-915c-76bd83113eb9.png','Grupo 1',['Deportes','Cumpleaños']),
  set('set-consultorio','Set consultorio','Celebra su profesión','158 piezas','21c21329-083f-488c-8674-b193e95c1f2a.png','Grupo 3',['Profesiones','Graduación']),
  set('set-cafe','Cita en el café','Un plan inolvidable','140 piezas','243775c4-7b83-46fe-9189-bcb9c7126e19.png','Grupo 3',['Pareja','Aniversario']),
  set('set-lab','Set laboratorio','Para mentes curiosas','166 piezas','28c7a5b5-6118-4db4-a29c-1fd288c86351.png','Grupo 3',['Profesiones','Graduación']),
  set('set-bbq','Barbacoa','El parche perfecto','54 piezas','28fb4712-de07-4428-b711-ac1fdc81068a.png','Grupo 1',['Amigos','Cumpleaños']),
  set('set-rayo-rojo','Rayo rojo','Modo velocidad','69 piezas','39883bba-ec0b-4a97-b51d-a867041ed255.png','Grupo 1',['Vehículos','Cumpleaños']),
  set('set-hotdog','Hot dog','Un clásico callejero','100 piezas','4158bd8a-a71e-4033-baaa-15fc1bccc947.png','Grupo 2',['Profesiones','Cumpleaños']),
  set('set-rayo-blanco','Rayo blanco','Modo velocidad','71 piezas','46ad66c4-1926-4dbf-b79c-6577283e2596.png','Grupo 1',['Vehículos','Cumpleaños']),
  set('set-jardin','Jardín secreto','Naturaleza en miniatura','117 piezas','48499fd1-79fc-4291-ad14-776a32ed285b.png','Grupo 2',['Pareja','Aniversario']),
  set('set-hockey','Mini hockey','Para jugar y exhibir','Set interactivo','50dad80b-49a5-400e-aced-d22c7b4530c7.png','Grupo 1',['Deportes','Cumpleaños']),
  set('set-bateria','Batería','Para quien vive la música','35 piezas','55596977-1ab7-4b2b-9d96-282363e33081.png','Grupo 1',['Música','Cumpleaños']),
  set('set-astronauta','Set astronauta','Una aventura espacial','152 piezas','6fdb0ac4-426f-4e27-bac0-6ddaf70a4bd2.png','Grupo 3',['Profesiones','Graduación']),
  set('set-billar','Mini billar','Para el salón de juegos','72 piezas','7bbb7996-777e-4368-8997-b600e6455116.png','Grupo 1',['Amigos','Cumpleaños']),
  set('set-piscina','Pisci Encanto','Vacaciones en miniatura','125 piezas','7ee002c8-dcd0-452b-afb3-c023d94cc4e6.png','Grupo 3',['Pareja','Vacaciones']),
  { id:'box-taller',name:'Minibox Taller',kicker:'Incluye mini set armable',category:'Minibox',detail:'65 piezas',image:BOX+'df814d06-067e-4b15-b7b5-9731d683f9ff.png',tag:'Minibox',group:'Minibox',occasion:['Profesiones','Cumpleaños'],description:'Una caja personalizada con minifiguras y un pequeño taller armable. Puedes elegir cantidad de figuras y fondo según disponibilidad.' },
  { id:'box-fitness',name:'Minibox Fitness',kicker:'Elige entre dos fondos',category:'Minibox',detail:'21 piezas',image:BOX+'462fcdf5-8fe1-48a2-8887-faa841811c09.png',tag:'Minibox',group:'Minibox',occasion:['Deportes','Cumpleaños'],description:'Minibox temática de entrenamiento con set armable, minifiguras y fondo personalizado.' },
  { id:'box-buena-vibra',name:'Minibox Buena Vibra',kicker:'Una noche para recordar',category:'Minibox',detail:'20 piezas',image:BOX+'f639f9d0-9aa9-4b9a-a278-594ce0a45ed2.png',tag:'Minibox',group:'Minibox',occasion:['Amigos','Cumpleaños'],description:'Minibox para representar una celebración o noche especial con figuras y escenario personalizado.' },
  figure('fig-galaxia','Colección Galaxia','150e20c4-8ea9-4212-94c6-b7e094347ea1.jpg'),
  figure('fig-magia','Mundo mágico','35bd0e27-9e52-444d-a3bb-f6914b3ac144.jpg'),
  figure('fig-heroes','Héroes y villanos','3b1a6036-5b2b-4a71-be55-7494a0c827cc.jpg'),
  figure('fig-aventura','Personajes de aventura','326ff765-15db-4c90-b6e0-8e35b665f560.jpg'),
  figure('fig-animados','Favoritos animados','ab2e970f-ffb1-43fe-b54a-9b5a77b572aa.jpg'),
  figure('fig-profesiones','Profesiones','9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg',['Profesiones','Graduación']),
  figure('fig-futbol','Futbolistas','eb1d49cf-4e35-42d4-b02e-51b80ca3f7ed.jpg',['Deportes','Cumpleaños']),
  figure('fig-clasicos','Dúos clásicos','263b7290-6417-4de0-ade4-cec663d73a55.jpg')
];

export interface VisualChoice { name:string; image:string; }
export const FORMATS: VisualChoice[] = [
  { name:'Set armable',image:SETS+'243775c4-7b83-46fe-9189-bcb9c7126e19.png' },
  { name:'Minibox',image:BOX+'df814d06-067e-4b15-b7b5-9731d683f9ff.png' },
  { name:'Solo minifiguras',image:FIGS+'9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg' }
];
export const FIGURE_STYLES: VisualChoice[] = [
  { name:'Pareja',image:FIGS+'06bec1bd-01d5-4a30-8593-f3908d2b64bd.jpg' },
  { name:'Familia',image:FIGS+'4037580f-c387-4ccd-b648-b61693339f95.jpg' },
  { name:'Profesión',image:FIGS+'9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg' },
  { name:'Personaje',image:FIGS+'0f80c2c1-31b2-4df2-b91c-c95db1469d98.jpg' }
];
export const SCENES: VisualChoice[] = [
  { name:'Parque',image:SETS+'0ea7c0ee-26b7-4829-a278-1f271e68a988.png' },
  { name:'Café',image:SETS+'243775c4-7b83-46fe-9189-bcb9c7126e19.png' },
  { name:'Profesión',image:SETS+'21c21329-083f-488c-8674-b193e95c1f2a.png' },
  { name:'Naturaleza',image:SETS+'48499fd1-79fc-4291-ad14-776a32ed285b.png' }
];
