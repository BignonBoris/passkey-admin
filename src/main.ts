import { createApp } from "vue";
import "./css/globals.css";
import "vue-tel-input/vue-tel-input.css";
import App from "./App.vue";
import { router } from "./router";
import { createI18n } from "vue-i18n";
import fr from "./locales/fr";
import en from "./locales/en";

import { createPinia } from "pinia";

import './_mockApis'

const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr, en },
})

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(router);



app.mount("#app");
