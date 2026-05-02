/// <reference types="vite/client" />
/// <reference types="google.maps" />
declare module "*.css";
declare module "swiper/css";

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}




