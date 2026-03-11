import { createApp } from "vue";
import App from "./App.vue";
import { createAppRuntime } from "./main/app";
import "./styles/index.css";

const app = createApp(App);

app.provide("appRuntime", createAppRuntime());
app.mount("#app");
