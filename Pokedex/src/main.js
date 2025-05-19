import './style.css';

const API_URL = "https://pokeapi.co/api/v2/pokedex/1/";

let currentPokemons = [];
let sortAscending = true;
let allPokemons = [];
let favoriteNames = loadFavorites();
let currentTab = "all"; // 'all' of 'favorites'

// --- FAVORIETEN OPSLAG ---
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

// --- UI: Tabs ---
function showTabs(onTabChange) {
    let tabDiv = document.getElementById('tab-bar');
    if (!tabDiv) {
        tabDiv = document.createElement('div');
        tabDiv.id = 'tab-bar';
        tabDiv.style.display = 'flex';
        tabDiv.style.justifyContent = 'center';
        tabDiv.style.gap = '20px';
        tabDiv.style.marginBottom = '24px';
        tabDiv.innerHTML = `
            <button id="tab-all" class="tab-btn tab-active">Alle Pokémon</button>
            <button id="tab-fav" class="tab-btn">Favorieten ⭐️</button>
        `;
        document.querySelector('#app').prepend(tabDiv);
    }
    document.getElementById('tab-all').onclick = () => onTabChange('all');
    document.getElementById('tab-fav').onclick = () => onTabChange('favorites');
    updateTabStyles();
}
function updateTabStyles() {
    document.getElementById('tab-all').classList.toggle('tab-active', currentTab === 'all');
    document.getElementById('tab-fav').classList.toggle('tab-active', currentTab === 'favorites');
}

// --- UI: Zoekbalk ---
function ensureSearchBar(onSearch) {
    const app = document.querySelector('#app');
    let searchDiv = document.getElementById('search-bar');
    if (!searchDiv) {
        searchDiv = document.createElement('div');
        searchDiv.id = 'search-bar';
        searchDiv.innerHTML = `
            <input type="text" id="search-input" placeholder="Zoek een Pokémon...">
        `;
        app.insertBefore(searchDiv, app.children[1] || null);
    }
    // Voeg maar één event toe
    let input = document.getElementById('search-input');
    if (!input._hasListener) {
        input.addEventListener('input', e => {
            const searchValue = e.target.value.trim().toLowerCase();
            onSearch(searchValue);
        });
        input._hasListener = true;
    }
}

async function getBasisPokemon(maxPokemons = 10) {
    const response = await fetch(API_URL);
    const data = await response.json();
    const entries = data.pokemon_entries.slice(0, maxPokemons);

    const basisPokemons = [];

    for (const entry of entries) {
        const speciesUrl = entry.pokemon_species.url;
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();

        if (speciesData.evolves_from_species === null) {
            const pokemonDataUrl = `https://pokeapi.co/api/v2/pokemon/${speciesData.name}`;
            const pokemonDataResponse = await fetch(pokemonDataUrl);
            const pokemonData = await pokemonDataResponse.json();

            basisPokemons.push({
                name: speciesData.name,
                url: speciesUrl,
                sprite: pokemonData.sprites.front_default,
                evolution_chain_url: speciesData.evolution_chain.url
            });
        }
    }
    return basisPokemons;
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

function showTable(pokemons) {
    const app = document.querySelector('#app');
    let oldTable = app.querySelector('table');
    if (oldTable) oldTable.remove();

    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>⭐️</th>
            <th>Foto</th>
            <th id="sort-name" style="cursor:pointer;">
                Naam (klikbaar)
                <span style="font-size: 0.8em;">&#8597;</span>
            </th>
            <th>Meer info</th>
        </tr>
    `;

    pokemons.forEach((pokemon, index) => {
        const isFav = isFavorite(pokemon.name);
        const star = isFav ? "⭐️" : "☆";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <button class="fav-btn" data-name="${pokemon.name}" title="Voeg toe aan favorieten" style="background:none; border:none; cursor:pointer; font-size: 1.2em;">
                    ${star}
                </button>
            </td>
            <td><img src="${pokemon.sprite}" alt="${pokemon.name}" width="60"/></td>
            <td>
                <button class="show-evolutions" data-index="${index}">
                    ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                </button>
            </td>
            <td>
                <button class="info-btn" data-name="${pokemon.name}">Meer info</button>
            </td>
        `;
        table.appendChild(row);
    });

    app.appendChild(table);

    // Favorieten
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.onclick = function (e) {
            e.stopPropagation();
            const name = this.getAttribute('data-name');
            toggleFavorite(name);
            refreshCurrentTab();
        };
    });

    // Sorteren
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

    // Evoluties
    document.querySelectorAll('.show-evolutions').forEach(btn => {
        btn.addEventListener('click', async function () {
            document.querySelectorAll('.evo-row').forEach(e => e.remove());
            const idx = this.getAttribute('data-index');
            const selectedPokemon = pokemons[idx];
            const evolutions = await getEvolutions(selectedPokemon.evolution_chain_url);

            const currentRow = table.rows[parseInt(idx) + 1];
            const evoRow = table.insertRow(currentRow.rowIndex + 1);
            evoRow.classList.add('evo-row');
            evoRow.style.transition = "all 0.4s";
            let evoCell = evoRow.insertCell(0);
            evoCell.colSpan = 4;

            let evoHtml = `<b>Evoluties van ${selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}:</b>`;
            if (evolutions.length === 0) {
                evoHtml += `<br><span style="color:gray;">Deze Pokémon heeft geen evoluties.</span>`;
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

            // Event listeners voor "Meer info" bij evoluties
            document.querySelectorAll('.info-btn-evo').forEach(btn => {
                btn.onclick = async function (e) {
                    e.stopPropagation();
                    const name = this.getAttribute('data-name');
                    showPokemonPopup(name);
                };
            });
        });
    });

    // POP-UP voor meer info
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.onclick = async function (e) {
            e.stopPropagation();
            const name = this.getAttribute('data-name');
            showPokemonPopup(name);
        };
    });
}


// ------- POP-UP FUNCTION -------
async function showPokemonPopup(pokemonName) {
    // Haal detaildata op van de pokemon endpoint
    const dataUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
    const resp = await fetch(dataUrl);
    const data = await resp.json();

    // Parse
    const naam = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const lengte = data.height / 10 + " m";
    const gewicht = data.weight / 10 + " kg";
    const types = data.types.map(t => t.type.name).join(', ');
    const abilities = data.abilities.map(a => a.ability.name).join(', ');
    const stats = data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join('<br>');

    // Bouw popup
    let popup = document.createElement('div');
    popup.className = "pokemon-popup-overlay";
    popup.innerHTML = `
      <div class="pokemon-popup">
        <button class="popup-close-btn" title="Sluiten">&times;</button>
        <div class="popup-content">
            <h2>${naam}</h2>
            <img src="${data.sprites.front_default}" alt="${naam}" width="100" style="background:#fff;border-radius:12px;margin-bottom:15px;"/>
            <div><strong>Lengte:</strong> ${lengte}</div>
            <div><strong>Gewicht:</strong> ${gewicht}</div>
            <div><strong>Type:</strong> ${types}</div>
            <div><strong>Abilities:</strong> ${abilities}</div>
            <div style="margin-top: 10px;"><strong>Stats:</strong><br>${stats}</div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // Sluiten met kruisje of buiten popup klikken
    popup.querySelector('.popup-close-btn').onclick = () => popup.remove();
    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
}

// ----- Refreshen van tabs -----
function refreshCurrentTab() {
    updateTabStyles();
    if (currentTab === 'all') {
        currentPokemons = allPokemons;
        const searchValue = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
        let filtered = currentPokemons.filter(p => p.name.toLowerCase().includes(searchValue));
        showTable(filtered);
    } else {
        // Favorieten tab
        const favPokemons = allPokemons.filter(p => isFavorite(p.name));
        currentPokemons = favPokemons;
        const searchValue = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
        let filtered = currentPokemons.filter(p => p.name.toLowerCase().includes(searchValue));
        showTable(filtered);
    }
}

// --- INIT ---
getBasisPokemon(10).then(basisPokemons => {
    allPokemons = basisPokemons;
    currentPokemons = basisPokemons;

    // Tabs
    showTabs(tab => {
        currentTab = tab;
        refreshCurrentTab();
    });

    // Zoekbalk
    ensureSearchBar((searchValue) => {
        let base = currentTab === 'favorites'
            ? allPokemons.filter(p => isFavorite(p.name))
            : allPokemons;
        let filtered = base.filter(p => p.name.toLowerCase().includes(searchValue));
        currentPokemons = filtered;
        showTable(filtered);
    });

    showTable(currentPokemons);
});
