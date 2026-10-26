/* The ship data (data/bfg_data.json), embedded in every page that uses it as
   <script id="bfgdata">, so the page works offline and from a file. */
export const DATA = JSON.parse(document.getElementById("bfgdata").textContent);
export const SHIPS = DATA.ships, LISTS = DATA.lists;
