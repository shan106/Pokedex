import './style.css';

const API_URL = "https://pokeapi.co/api/v2/pokedex/1/";

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

    // Sla de basis-Pokémon over:
    evolutions = evolutions.slice(1);

    // Haal sprites op
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
    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>Foto</th>
            <th>Naam (klikbaar)</th>
            <th>Meer info</th>
        </tr>
    `;

    pokemons.forEach((pokemon, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
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

    app.innerHTML = '';
    app.appendChild(table);

    // Event listeners toevoegen aan naam-buttons
    document.querySelectorAll('.show-evolutions').forEach(btn => {
        btn.addEventListener('click', async function () {
            // Eerst eventuele oude open evoluties sluiten
            document.querySelectorAll('.evo-row').forEach(e => e.remove());

            const idx = this.getAttribute('data-index');
            const selectedPokemon = pokemons[idx];
            const evolutions = await getEvolutions(selectedPokemon.evolution_chain_url);

            // Vind de huidige rij en voeg direct erna een evolutierij toe
            const currentRow = table.rows[parseInt(idx) + 1]; // +1 door de header
            const evoRow = table.insertRow(currentRow.rowIndex + 1);
            evoRow.classList.add('evo-row');
            evoRow.style.transition = "all 0.4s";
            let evoCell = evoRow.insertCell(0);
            evoCell.colSpan = 3;

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

// Start de app
getBasisPokemon(10).then(basisPokemons => {
    showTable(basisPokemons);
});
