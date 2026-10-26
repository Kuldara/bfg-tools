/* The version is set by the build (tools/build.js); "dev" when the modules run
   unbundled, as they do in the tests. */
export const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
export const $ = s => document.querySelector(s);
