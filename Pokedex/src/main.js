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
                <a href="${pokemon.url}" target="_blank"><button>Meer info</button></a>
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
            // Herteken huidige tab
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
                            <a href="${evo.url}" target="_blank"><button>Meer info</button></a>
                        </div>
                    `;
                });
                evoHtml += "</div>";
            }

            evoCell.innerHTML = evoHtml;
            evoRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

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
