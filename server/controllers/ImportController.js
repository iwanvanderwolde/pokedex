import {v4 as uuidv4} from 'uuid';

class ImportController {
    constructor() {
        this.db = null;
        this.initializeDb();
    }

    async initializeDb() {
        const {db: importedDb} = await import("../app.js");
        this.db = importedDb;

        await this.retrieveAbilitiesFromDb();

        await this.retrievePokemonsFromDb();
    }

    async retrievePokemonsFromDb() {
        const query = "SELECT * FROM main.pokemons";
        const result = this.db.prepare(query).all();
        await this.fetchPokemons(result.length);

    }


    async fetchPokemons(resultLength) {

        const limit = 50;
        let offset = 0;
        let allPokemon = [];
        let totalCount = 0;


        try {
            const response = await fetch("https://pokeapi.newdeveloper.nl/api/v2/pokemon?limit=1");
            if (!response.ok) throw new Error(`Failed to fetch total count: ${response.status}`);
            const data = await response.json();
            totalCount = data.count;
        } catch (error) {
            console.error("❌ Error fetching total count:", error);
            return;
        }

        while (resultLength < totalCount) {

            console.log(`🔄 Fetching Pokémon: ${offset + 1} to ${offset + limit}...`);

            try {
                const batchResponse = await fetch(`https://pokeapi.newdeveloper.nl/api/v2/pokemon?limit=${limit}&offset=${offset}`);
                if (!batchResponse.ok) {
                    console.error(`❌ Error fetching batch at offset ${offset}: ${batchResponse}`);
                    console.warn(`⚠️ Skipping offset ${offset} due to an error (${batchResponse.status})`);
                    offset += limit;
                    continue;
                }
                const batchData = await batchResponse.json();
                if (batchData.results.length === 0) {
                    console.warn(`⚠️ No Pokémon found at offset ${offset}, skipping...`);
                    offset += limit;
                    if (resultLength < totalCount) {
                        break
                    } else{
                        continue
                    }
                }

                const detailedPokemon = await Promise.all(
                    batchData.results.map(async (pokemon) => {
                        try {
                            const detailsResponse = await fetch(pokemon.url);
                            if (!detailsResponse.ok) {
                                console.warn(`⚠️ Skipping Pokémon ${pokemon.name} (ID: ${details.id}) due to an error (${detailsResponse.status})`);
                                return null;
                            }
                            return await detailsResponse.json();
                        } catch (error) {
                            console.error(`❌ Error fetching details for ${pokemon.name}:`, error);
                            return null;
                        }
                    })
                );

                const validPokemon = detailedPokemon.filter(p => p !== null);
                for (const detailPokemon of detailedPokemon) {
                    if (detailPokemon.id === 10279) {
                        console.warn("⚠️ Skipping missing Pokémon (ID: 10279)");
                    }
                }

                for (const details of validPokemon) {
                    let pokemon_id = uuidv4();
                    const query = "INSERT INTO main.pokemons (id, name, weight, api_id, base_experience) VALUES (?, ?, ?, ?, ?)";
                    this.db.prepare(query).run(pokemon_id, details.name, details.weight, details.id, details.base_experience);

                    if (details.abilities.length > 0) {
                        console.log(details.abilities[0].ability.name);
                    } else {
                        console.warn(`⚠️ Pokémon ${details.name} has no abilities.`);
                    }

                    const uniqueAbilities = new Set(details.abilities.map(a => a.ability.name));

                    for (const abilityName of uniqueAbilities) {
                        await this.linkPokemonToAbility(abilityName, pokemon_id);
                    }
                }

                allPokemon.push(...validPokemon);
            } catch (error) {
                console.error(`❌ Error fetching batch at offset ${offset}:`, error);
            }

            offset += limit;
        }

        console.log("✅ All Pokémon fetched and stored.");
        this.pokemons(allPokemon);
    }


    async pokemons(allPokemon) {
        try {

            const pokemonsInDbQuery = "SELECT * FROM main.pokemons WHERE name = ?";
            for (const pokemon of allPokemon) {
                const pokemonsInDb = this.db.prepare(pokemonsInDbQuery).get(pokemon.name);
                if (!pokemonsInDb) {
                    console.log(`✅ Inserting missing Pokémon: ${pokemon.name}`);
                    // Insert the Pokémon here if missing
                }
            }


        } catch (error) {
            console.error("Error fetching Pokémon:", error);
        }
    }

    async linkPokemonToAbility(abilitiesName, pokemon_id) {


        const query = "SELECT * FROM abilities WHERE name = ?";
        const result = await this.db.prepare(query).get(abilitiesName);
        const inputPokemonAbility = "INSERT INTO ability_pokemon (ability_id, pokemon_id) VALUES (?, ?)";

        if (result) {
            try {
                console.log(`🔗 Linking Pokémon ${pokemon_id} to ability ${abilitiesName}`);
                this.db.prepare(inputPokemonAbility).run(result.id, pokemon_id);
            } catch (error) {
                console.error("Error linking Pokémon to ability:", error);
            }
        }

    }

    async retrieveAbilitiesFromDb() {
        const query = "SELECT * FROM main.abilities";
        const result = this.db.prepare(query).all();
        let totalCount = 0;

        try {
            const response = await fetch("https://pokeapi.newdeveloper.nl/api/v2/ability?limit=1");
            if (!response.ok) {
                console.error(`Failed to fetch ability count: ${response.status}`);
                return;
            }
            const data = await response.json();
            totalCount = data.count;
        } catch (error) {
            console.error("Error fetching ability count:", error);
            return;
        }
        if (result.length < totalCount) {
            console.log("🔄 Fetching abilities..." + totalCount);
            await this.fetchAbilities();
            console.log("✅ All abilities stored in database");
        } else {
            console.log("✅ Abilities already in database");
        }
    }

    async fetchAbilities() {
        const limit = 50;
        let offset = 0;
        let allAbilities = [];
        let totalCount = 0;

        try {
            const response = await fetch("https://pokeapi.newdeveloper.nl/api/v2/ability?limit=1");
            if (!response.ok) throw new Error(`Failed to fetch total count: ${response.status}`);
            const data = await response.json();
            totalCount = data.count;
            console.log(`🔄 Total abilities to fetch: ${totalCount}`);
        } catch (error) {
            console.error("❌ Error fetching total ability count:", error);
            return;
        }

        let fetchedAbilityIds = new Set();

        while (offset < totalCount) {
            console.log(`🔄 Fetching abilities: ${offset + 1} to ${offset + limit}...`);

            try {
                const batchResponse = await fetch(`https://pokeapi.newdeveloper.nl/api/v2/ability?limit=${limit}&offset=${offset}`);
                if (!batchResponse.ok) {
                    console.warn(`⚠️ Skipping offset ${offset} due to an error (${batchResponse.status})`);
                    offset += limit;
                    continue;
                }

                const batchData = await batchResponse.json();
                if (batchData.results.length === 0) {
                    console.warn(`⚠️ No abilities found at offset ${offset}, skipping...`);
                    offset += limit;
                    continue;
                }

                const detailedAbilities = await Promise.all(
                    batchData.results.map(async (ability) => {
                        try {
                            const detailsResponse = await fetch(ability.url);
                            if (!detailsResponse.ok) {
                                console.warn(`⚠️ Skipping ability ${ability.name} due to an error (${detailsResponse.status})`);
                                return null;
                            }
                            const details = await detailsResponse.json();
                            fetchedAbilityIds.add(details.id);
                            return details;
                        } catch (error) {
                            console.error(`❌ Error fetching details for ${ability.name}:`, error);
                            return null;
                        }
                    })
                );

                const validAbilities = detailedAbilities.filter(a => a !== null);

                for (const details of validAbilities) {
                    let ability_id = uuidv4();
                    console.log(`🗄️ Storing ability in DB: ${details.name} (ID: ${details.id})`);
                    const query = "INSERT INTO main.abilities (id, name, api_id) VALUES (?, ?, ?)";
                    this.db.prepare(query).run(ability_id, details.name, details.id);
                }

                allAbilities.push(...validAbilities);
            } catch (error) {
                console.error(`❌ Error fetching batch at offset ${offset}:`, error);
            }

            offset += limit;
        }

        console.log("🔍 Checking for missing abilities...");

        console.log(`✅ Successfully fetched and stored ${allAbilities.length} abilities.`);
    }

}

new ImportController();


export default ImportController;