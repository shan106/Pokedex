import './style.css'
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

        // Alleen basis-Pokémon (geen evolves_from_species)
        if (speciesData.evolves_from_species === null) {
            // Haal afbeelding op via de andere endpoint
            const pokemonDataUrl = `https://pokeapi.co/api/v2/pokemon/${speciesData.name}`;
            const pokemonDataResponse = await fetch(pokemonDataUrl);
            const pokemonData = await pokemonDataResponse.json();

            basisPokemons.push({
                name: speciesData.name,
                url: speciesUrl,
                sprite: pokemonData.sprites.front_default
            });
        }
    }
    return basisPokemons;
}

function showTable(pokemons) {
    const app = document.querySelector('#app');
    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>Foto</th>
            <th>Naam</th>
            <th>Meer info</th>
        </tr>
    `;

    pokemons.forEach(pokemon => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${pokemon.sprite}" alt="${pokemon.name}" width="60"/></td>
            <td>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</td>
            <td><a href="${pokemon.url}" target="_blank"><button>Meer info</button></a></td>
        `;
        table.appendChild(row);
    });

    app.innerHTML = '';
    app.appendChild(table);
}

// Start de app
getBasisPokemon(10).then(basisPokemons => {
    showTable(basisPokemons);
});
