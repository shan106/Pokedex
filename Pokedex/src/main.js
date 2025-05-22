import './style.css';

// ==== THEMA DATA ====
const THEME_DATA = {
    charmander: {
        name: "Charmander",
        color: "#f08030",
        bg: "#fff4e8",
        accent: "#b54a18",
        logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png"
    },
    bulbasaur: {
        name: "Bulbasaur",
        color: "#78c850",
        bg: "#e6fbe8",
        accent: "#436732",
        logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
    },
    squirtle: {
        name: "Squirtle",
        color: "#6890f0",
        bg: "#e8f0ff",
        accent: "#355682",
        logo: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png"
    }
};
let currentTheme = loadTheme();

function saveTheme(themeKey) {
    localStorage.setItem('pokemonTheme', themeKey);
}
function loadTheme() {
    return localStorage.getItem('pokemonTheme') || "charmander";
}
function applyTheme(themeKey) {
    const theme = THEME_DATA[themeKey];
    document.documentElement.style.setProperty('--main-color', theme.color);
    document.documentElement.style.setProperty('--bg-color', theme.bg);
    document.documentElement.style.setProperty('--accent-color', theme.accent);

    // Logo
    let logoDiv = document.getElementById('theme-logo');
    if (!logoDiv) {
        logoDiv = document.createElement('div');
        logoDiv.id = "theme-logo";
        const app = document.getElementById('app');
        app.prepend(logoDiv);
    }
    logoDiv.innerHTML = `<img src="${theme.logo}" alt="${theme.name}" class="logo-img">`;
}
function showThemeSelector() {
    let selector = document.getElementById('theme-selector-bar');
    if (!selector) {
        selector = document.createElement('div');
        selector.id = "theme-selector-bar";
        selector.innerHTML = `
            <select id="theme-select" class="theme-select">
                <option value="charmander">Charmander</option>
                <option value="bulbasaur">Bulbasaur</option>
                <option value="squirtle">Squirtle</option>
            </select>
        `;
        const app = document.getElementById('app');
        app.insertBefore(selector, app.firstChild.nextSibling); // na het logo
    }
    document.getElementById('theme-select').value = currentTheme;
    document.getElementById('theme-select').onchange = function () {
        currentTheme = this.value;
        saveTheme(currentTheme);
        applyTheme(currentTheme);
    };
}

// ==== APP LOGICA ====
const API_URL = "https://pokeapi.co/api/v2/pokedex/1/";

let currentPokemons = [];
let sortAscending = true;
let allPokemons = [];
let allPokemonsLoaded = [];
let favoriteNames = loadFavorites();
let currentTab = "all";
let allTypes = [];
let selectedType = "all";
let caughtPokemons = loadCaughtPokemons();
let observer = null;

let offset = 0;
const PAGE_SIZE = 25;
let loadingPokemons = false;
let doneLoading = false;

function saveFavorites() {
    localStorage.setItem('favoritePokemons', JSON.stringify(favoriteNames));
}
function loadFavorites() {
    const favs = localStorage.getItem('favoritePokemons');
    return favs ? JSON.parse(favs) : [];
}
function isFavorite(pokemonName) {
    return favoriteNames.includes(pokemonName);
}
function toggleFavorite(pokemonName) {
    if (isFavorite(pokemonName)) {
        favoriteNames = favoriteNames.filter(n => n !== pokemonName);
    } else {
        favoriteNames.push(pokemonName);
    }
    saveFavorites();
}
function saveCaughtPokemons() {
    localStorage.setItem('caughtPokemons', JSON.stringify(caughtPokemons));
}
function loadCaughtPokemons() {
    const cp = localStorage.getItem('caughtPokemons');
    return cp ? JSON.parse(cp) : {};
}
function catchRandomPokemon() {
    if (Math.random() > 0.7) return null;
    if (allPokemons.length === 0) return null;
    const i = Math.floor(Math.random() * allPokemons.length);
    return allPokemons[i];
}
function addCaught(pokemon) {
    if (!pokemon) return;
    if (!caughtPokemons[pokemon.name]) {
        caughtPokemons[pokemon.name] = {
            name: pokemon.name,
            sprite: pokemon.sprite,
            count: 1
        };
    } else {
        caughtPokemons[pokemon.name].count++;
    }
    saveCaughtPokemons();
}
function getCaughtArray() {
    return Object.values(caughtPokemons).sort((a, b) => a.name.localeCompare(b.name));
}
async function getStandardTypes() {
    const response = await fetch("https://pokeapi.co/api/v2/type");
    const data = await response.json();
    const exclude = ["shadow", "unknown"];
    return data.results
        .map(t => t.name)
        .filter(t => !exclude.includes(t));
}
async function getBasisPokemon({ offset = 0, limit = PAGE_SIZE } = {}) {
    const response = await fetch(API_URL);
    const data = await response.json();
    const entries = data.pokemon_entries.slice(offset, offset + limit);

    const basisPokemons = [];

    for (const entry of entries) {
        const speciesUrl = entry.pokemon_species.url;
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();

        if (speciesData.evolves_from_species === null) {
            const pokemonDataUrl = `https://pokeapi.co/api/v2/pokemon/${speciesData.name}`;
            const pokemonDataResponse = await fetch(pokemonDataUrl);
            const pokemonData = await pokemonDataResponse.json();

            // Vermijd duplicaten
            if (allPokemonsLoaded.includes(speciesData.name)) continue;
            allPokemonsLoaded.push(speciesData.name);

            basisPokemons.push({
                name: speciesData.name,
                url: speciesUrl,
                sprite: pokemonData.sprites.front_default,
                evolution_chain_url: speciesData.evolution_chain.url,
                types: pokemonData.types.map(t => t.type.name),
                weight: pokemonData.weight / 10 // kg
            });
        }
    }
    return basisPokemons;
}

// ===== UI =====
function renderUI() {
    const app = document.querySelector('#app');
    app.innerHTML = `
        <div id="tabs-container"></div>
        <div id="filter-and-search"></div>
        <div id="main-content"></div>
    `;
    applyTheme(currentTheme);
    showThemeSelector();

    showTabs(tab => {
        currentTab = tab;
        renderUI(); // Alles opnieuw, nu met deze tab actief
    });
    if (currentTab === 'catch') {
        document.getElementById('filter-and-search').innerHTML = '';
        showCatchTab();
        disconnectObserver();
    } else {
        showTypeFilter(allTypes, (type) => {
            selectedType = type;
            filterAndShow();
        });
        ensureSearchBar(() => {
            filterAndShow();
        });
        filterAndShow();
    }
}
function showTabs(onTabChange) {
    const tabs = `
        <button id="tab-all" class="tab-btn${currentTab === 'all' ? ' tab-active' : ''}">Alle Pokémon</button>
        <button id="tab-fav" class="tab-btn${currentTab === 'favorites' ? ' tab-active' : ''}">Favorieten ⭐️</button>
        <button id="tab-catch" class="tab-btn${currentTab === 'catch' ? ' tab-active' : ''}">Vangen 🎯</button>
    `;
    document.getElementById('tabs-container').innerHTML = tabs;
    document.getElementById('tab-all').onclick = () => onTabChange('all');
    document.getElementById('tab-fav').onclick = () => onTabChange('favorites');
    document.getElementById('tab-catch').onclick = () => onTabChange('catch');
}

// ---- FORMULIER met VALIDATIE ZOEK ----
function showTypeFilter(types, onFilter) {
    document.getElementById('filter-and-search').innerHTML = `
        <div id="type-filter-bar">
            <select id="type-filter" class="type-filter">
                <option value="all">All types</option>
                ${types.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("")}
            </select>
        </div>
        <form id="search-form">
            <div id="search-bar">
                <input type="text" id="search-input" placeholder="Zoek een Pokémon..." class="search-input" autocomplete="off">
                <span id="search-error" class="search-error"></span>
            </div>
        </form>
    `;
    document.getElementById('type-filter').onchange = function () {
        onFilter(this.value);
    };
}

function ensureSearchBar(onSearch) {
    const input = document.getElementById('search-input');
    const form = document.getElementById('search-form');
    const errorEl = document.getElementById('search-error');

    function validateAndSearch(e) {
        const value = input.value.trim();
        // Alleen letters, spaties, 2-20 tekens
        const regex = /^[a-zA-Z\s]{2,20}$/;
        if (value.length === 0) {
            errorEl.textContent = '';
            input.classList.remove('input-error');
            onSearch('');
            return;
        }
        if (!regex.test(value)) {
            errorEl.textContent = 'Alleen letters, minimaal 2 tekens!';
            input.classList.add('input-error');
        } else {
            errorEl.textContent = '';
            input.classList.remove('input-error');
            onSearch(value.toLowerCase());
        }
    }

    if (!input._hasListener) {
        input.addEventListener('input', validateAndSearch);
        input._hasListener = true;
    }
    if (form && !form._hasListener) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            validateAndSearch();
        });
        form._hasListener = true;
    }
}

// Rest van de code: alles zoals je gewend bent (met infinite scroll, table, catch, popup...)

function showTable(pokemons) {
    const main = document.getElementById('main-content');
    let table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>⭐️</th>
            <th>Foto</th>
            <th id="sort-name" class="sortable-header">
                Naam (klikbaar)
                <span class="sort-arrow">&#8597;</span>
            </th>
            <th>Types</th>
            <th>Gevangen</th>
            <th>(kg)</th>
            <th>Meer info</th>
        </tr>
    `;
    pokemons.forEach((pokemon, index) => {
        const isFav = isFavorite(pokemon.name);
        const star = isFav ? "⭐️" : "☆";
        const typesHtml = pokemon.types.map(t =>
            `<span class="type-pill">${t.charAt(0).toUpperCase() + t.slice(1)}</span>`).join(" ");
        const caughtCount = caughtPokemons[pokemon.name]?.count || 0;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <button class="fav-btn" data-name="${pokemon.name}" title="Voeg toe aan favorieten">${star}</button>
            </td>
            <td><img src="${pokemon.sprite}" alt="${pokemon.name}" width="60"/></td>
            <td>
                <button class="show-evolutions" data-index="${index}">
                    ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                </button>
            </td>
            <td>${typesHtml}</td>
            <td>${caughtCount}</td>
            <td>${pokemon.weight}</td>
            <td>
                <button class="info-btn" data-name="${pokemon.name}">Meer info</button>
            </td>
        `;
        table.appendChild(row);
    });
    main.innerHTML = '';
    main.appendChild(table);

    let oldTarget = document.getElementById('observer-target');
    if (oldTarget) oldTarget.remove();
    let target = document.createElement('div');
    target.id = 'observer-target';
    main.appendChild(target);
    setupObserver();

    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.onclick = function (e) {
            e.stopPropagation();
            const name = this.getAttribute('data-name');
            toggleFavorite(name);
            renderUI();
        };
    });
    document.getElementById('sort-name').onclick = function () {
        sortAscending = !sortAscending;
        showTable(
            [...currentPokemons].sort((a, b) =>
                sortAscending
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
            )
        );
    };
    document.querySelectorAll('.show-evolutions').forEach(btn => {
        btn.addEventListener('click', async function () {
            document.querySelectorAll('.evo-row').forEach(e => e.remove());
            const idx = this.getAttribute('data-index');
            const selectedPokemon = pokemons[idx];
            const evolutions = await getEvolutions(selectedPokemon.evolution_chain_url);

            const currentRow = table.rows[parseInt(idx) + 1];
            const evoRow = table.insertRow(currentRow.rowIndex + 1);
            evoRow.classList.add('evo-row');
            let evoCell = evoRow.insertCell(0);
            evoCell.colSpan = 7;

            let evoHtml = `<b>Evoluties van ${selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}:</b>`;
            if (evolutions.length === 0) {
                evoHtml += `<br><span class="no-evo">Deze Pokémon heeft geen evoluties.</span>`;
            } else {
                evoHtml += `<div class="evolution-list">`;
                evolutions.forEach(evo => {
                    evoHtml += `
                        <div class="evolution-list-item">
                            <img src="${evo.sprite}" alt="${evo.name}">
                            <span>${evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</span>
                            <button class="info-btn-evo" data-name="${evo.name}">Meer info</button>
                        </div>
                    `;
                });
                evoHtml += "</div>";
            }

            evoCell.innerHTML = evoHtml;
            evoRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

            document.querySelectorAll('.info-btn-evo').forEach(btn => {
                btn.onclick = async function (e) {
                    e.stopPropagation();
                    const name = this.getAttribute('data-name');
                    showPokemonPopup(name);
                };
            });
        });
    });
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.onclick = async function (e) {
            e.stopPropagation();
            const name = this.getAttribute('data-name');
            showPokemonPopup(name);
        };
    });
}

function showCatchTab() {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    let div = document.createElement('div');
    div.className = 'catch-container';
    div.innerHTML = `
        <h2 class="catch-header">Pokémon vangen</h2>
        <button id="catch-btn" class="catch-btn">Vang een Pokémon!</button>
        <div id="catch-message" class="catch-message"></div>
        <h3 class="caught-title">Gevangen Pokémon</h3>
        <div id="caught-table-container"></div>
    `;
    main.appendChild(div);

    document.getElementById('catch-btn').onclick = function () {
        let caught = catchRandomPokemon();
        let msgDiv = document.getElementById('catch-message');
        if (!caught) {
            msgDiv.innerHTML = `<span class="catch-fail">Helaas, de Pokémon is ontsnapt!</span>`;
            msgDiv.classList.remove('catch-success');
            msgDiv.classList.add('catch-fail');
        } else {
            addCaught(caught);
            msgDiv.innerHTML = `<span class="catch-success">Gefeliciteerd! Je hebt <b>${caught.name.charAt(0).toUpperCase() + caught.name.slice(1)}</b> gevangen!</span>`;
            msgDiv.classList.remove('catch-fail');
            msgDiv.classList.add('catch-success');
            renderCaughtTable();
        }
    };
    renderCaughtTable();
}
function renderCaughtTable() {
    let c = getCaughtArray();
    let html = '';
    if (c.length === 0) {
        html = `<p class="no-catch">Nog geen Pokémon gevangen...</p>`;
    } else {
        html = `<table class="caught-table"><tr>
            <th>Foto</th><th>Naam</th><th>Aantal gevangen</th></tr>`;
        c.forEach(p => {
            html += `<tr>
                <td><img src="${p.sprite}" alt="${p.name}" width="60"></td>
                <td>${p.name.charAt(0).toUpperCase() + p.name.slice(1)}</td>
                <td>${p.count}</td>
            </tr>`;
        });
        html += `</table>`;
    }
    document.getElementById('caught-table-container').innerHTML = html;
}
async function showPokemonPopup(pokemonName) {
    const dataUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
    const resp = await fetch(dataUrl);
    const data = await resp.json();

    const naam = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const lengte = data.height / 10 + " m";
    const gewicht = data.weight / 10 + " kg";
    const types = data.types.map(t => t.type.name).join(', ');
    const abilities = data.abilities.map(a => a.ability.name).join(', ');
    const stats = data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join('<br>');

    let popup = document.createElement('div');
    popup.className = "pokemon-popup-overlay";
    popup.innerHTML = `
      <div class="pokemon-popup">
        <button class="popup-close-btn" title="Sluiten">&times;</button>
        <div class="popup-content">
            <h2>${naam}</h2>
            <img src="${data.sprites.front_default}" alt="${naam}" width="100" class="popup-img"/>
            <div><strong>Lengte:</strong> ${lengte}</div>
            <div><strong>Gewicht:</strong> ${gewicht}</div>
            <div><strong>Type:</strong> ${types}</div>
            <div><strong>Abilities:</strong> ${abilities}</div>
            <div class="popup-stats"><strong>Stats:</strong><br>${stats}</div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    popup.querySelector('.popup-close-btn').onclick = () => popup.remove();
    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
}
async function getEvolutions(evolutionChainUrl) {
    const response = await fetch(evolutionChainUrl);
    const data = await response.json();

    let evolutions = [];
    let node = data.chain;

    while (node) {
        evolutions.push(node.species.name);
        if (node.evolves_to && node.evolves_to.length > 0) {
            node = node.evolves_to[0];
        } else {
            break;
        }
    }

    evolutions = evolutions.slice(1);

    const evolutionsWithSprites = [];
    for (let name of evolutions) {
        const pokemonDataUrl = `https://pokeapi.co/api/v2/pokemon/${name}`;
        const pokemonDataResponse = await fetch(pokemonDataUrl);
        const pokemonData = await pokemonDataResponse.json();
        evolutionsWithSprites.push({
            name,
            sprite: pokemonData.sprites.front_default,
            url: `https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}/`
        });
    }

    return evolutionsWithSprites;
}

// -------- Infinite scroll met Observer API -------------
function disconnectObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}
function setupObserver() {
    disconnectObserver();
    if (currentTab !== 'all' && currentTab !== 'favorites') return;
    const target = document.getElementById('observer-target');
    if (!target) return;
    observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && !loadingPokemons && !doneLoading) {
            loadingPokemons = true;
            await fetchAndAppendPokemons();
            loadingPokemons = false;
            filterAndShow();
        }
    }, {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
    });
    observer.observe(target);
}
async function fetchAndAppendPokemons() {
    if (doneLoading) return;
    const newPokemons = await getBasisPokemon({ offset, limit: PAGE_SIZE });
    if (newPokemons.length === 0) {
        doneLoading = true;
        return;
    }
    allPokemons = allPokemons.concat(newPokemons);
    offset += PAGE_SIZE;
}

// -------- FILTER + SEARCH -----------
function filterAndShow() {
    let base = currentTab === 'favorites'
        ? allPokemons.filter(p => isFavorite(p.name))
        : allPokemons;
    let filtered = (selectedType === "all")
        ? base
        : base.filter(p => p.types.includes(selectedType));
    const searchValue = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    if (searchValue) {
        // Als validatie faalt, filter niet
        const regex = /^[a-zA-Z\s]{2,20}$/;
        if (!regex.test(searchValue)) {
            currentPokemons = [];
            showTable([]);
            return;
        }
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchValue));
    }
    currentPokemons = filtered;
    showTable(filtered);
}

// =========== INIT ===========
getStandardTypes().then(types => {
    allTypes = types;
    getBasisPokemon({ offset, limit: PAGE_SIZE }).then(basisPokemons => {
        allPokemons = basisPokemons;
        allPokemonsLoaded = basisPokemons.map(p => p.name);
        offset += PAGE_SIZE;
        currentPokemons = basisPokemons;
        renderUI();
    });
});
