# Pokédex App

## Projectbeschrijving

Deze applicatie is een interactieve Pokédex, gebouwd als moderne Single Page Application met **Vite Vanilla JS**.  
Je kunt door alle basis Pokémon bladeren, filteren op type, zoeken, sorteren, Pokémon vangen, favorieten kiezen én het thema wisselen tussen Charmander, Bulbasaur en Squirtle.  
Alle data wordt opgehaald via de officiële [PokéAPI](https://pokeapi.co/), en gebruikersvoorkeuren (zoals thema, favorieten en gevangen Pokémon) worden **permanent opgeslagen** in LocalStorage.

---

## Functionaliteiten

- **Pokémon-lijst**: Toon een tabel van basis Pokémon met naam, sprite, types, gevangen aantal, gewicht, favoriet-knop, evoluties en “meer info” popup.
- **Filteren & Zoeken**: Filter op type, zoek live op naam.
- **Sorteren**: Sorteer op naam (A-Z, Z-A).
- **Favorieten**: Sla favoriete Pokémon op in een apart tabblad.
- **Pokémon vangen**: Vang random Pokémon, zie hoeveel keer je elke Pokémon hebt gevangen.
- **Evoluties**: Toon de evolutielijn onder een Pokémon, met plaatjes en info-popups.
- **Infinite Scroll**: Laad automatisch meer Pokémon als je naar beneden scrolt (Observer API).
- **Thema-switcher**: Kies uit drie thema’s met verschillende kleuren en logo’s.
- **Permanente opslag**: Thema, favorieten, gevangen Pokémon blijven bewaard dankzij LocalStorage.
- **Responsief & modern**: Mooie knoppen, pill-stijl types, popups, en mobiele weergave.
- **Volledig gescheiden HTML, CSS en JS in src/**.

---

## Gebruikte API’s

- **[PokéAPI](https://pokeapi.co/)**  
  - Basis endpoint: [`https://pokeapi.co/api/v2/pokedex/1/`](https://pokeapi.co/api/v2/pokedex/1/)  
  - Pokémon detail: [`https://pokeapi.co/api/v2/pokemon/{name}`](https://pokeapi.co/docs/v2#pokemon)
  - Type lijst: [`https://pokeapi.co/api/v2/type`](https://pokeapi.co/api/v2/type)
  - Evolutieketen: [`https://pokeapi.co/api/v2/evolution-chain/{id}/`](https://pokeapi.co/api/v2/evolution-chain/1/)

---

## Technische vereisten & waar in de code

| Vereiste                                  | Implementatie                                           |
|--------------------------------------------|--------------------------------------------------------|
| **DOM manipulatie**                       | Overal: UI wordt met JS opgebouwd, bv. in `showTable` (lijn 249) |
| **Elementen selecteren**                   | `document.getElementById`, `querySelectorAll`, etc.    |
| **Elementen manipuleren**                  | `.innerHTML`, `.appendChild`, etc.                     |
| **Events koppelen**                        | Click-events op knoppen, tabbladen, zoeken (lijn 213) |
| **Gebruik van constanten**                 | Hele bovenkant van main.js (`const ...`)               |
| **Template literals**                      | In bijna alle rendering-functies voor HTML (bv. showTable) |
| **Iteratie over arrays**                   | `forEach`, `map`, `filter` in heel de code             |
| **Array methodes**                         | `map`, `filter`, `sort`, `forEach`, `slice`, enz.      |
| **Arrow functions**                        | Bijvoorbeeld in alle array callbacks (`pokemons.map(...)`) |
| **Conditional (ternary) operator**         | Bijvoorbeeld: `<option value="all">All types</option>` in typefilter |
| **Callback functions**                     | Bijv. in event handlers en array methods               |
| **Promises / Async & Await**               | Bij elke fetch, bv. `async function getBasisPokemon...` (lijn 149) |
| **Observer API**                           | Infinite scroll: zie `setupObserver()` (lijn 494)     |
| **Fetch API voor data ophalen**            | `fetch(...)` bij API-calls (bv. lijn 142) |
| **JSON manipuleren en weergeven**          | Overal na elke fetch                                  |
| **LocalStorage (permanente opslag)**       | Voor favorieten, gevangen Pokémon, thema (lijn 94) |
| **Basis HTML layout (Flexbox)**            | Zie style.css, layout containers (#app, #tabs-container, etc) |
| **Gebruiksvriendelijke elementen**         | Duidelijke knoppen, ster-iconen, type-pills, popups, tabbladen |
| **Projectstructuur (gescheiden bestanden)**| Alles in `/src` folder, gescheiden main.js & style.css, losse index.html |




---

## Installatiehandleiding

1. **Kloon deze repository**:
   ```bash
   git clone 
   cd projectmap
   ```
2. **Installeer dependencies**:
   ```bash
   npm install
   ```
3. **Start de ontwikkelserver**:
   ```bash
   npm run dev
   ```
4. **Open in de browser**:  
   Ga naar [http://localhost:5173](http://localhost:5173)  
  

---

## Screenshots



## Screenshots

| **Hoofdscherm met tabel**                                                                                   | **Evoluties**                                                                                        | **Meer Info-tab**                                                                                         | **Catch-tab**                                                                                          | **Thema-switcher**                                                                                        |
|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| <img width="716" alt="image" src="https://github.com/user-attachments/assets/163600de-f8d5-436b-b135-42b292750074" /> | <img width="556" alt="image" src="https://github.com/user-attachments/assets/5c3347b3-6f73-47b3-8c93-acf4f9966f31" /> | <img width="215" alt="image" src="https://github.com/user-attachments/assets/e4f0c2fc-be23-4d2d-bdc5-b7a373362ca6" /> | <img width="419" alt="image" src="https://github.com/user-attachments/assets/e5c2df8c-2fa4-4886-a82b-92d9f3b0463f" /> | <img width="580" alt="image" src="https://github.com/user-attachments/assets/7a4ea4c1-2552-454c-a5d4-b04cbaaca470" /> |


---

## Gebruikte bronnen

- [PokéAPI Documentatie](https://pokeapi.co/docs/v2)
- [MDN Web Docs: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Vite Documentation](https://vitejs.dev/)
- **AI Chat :** advies, code en troubleshooting voor dit project
