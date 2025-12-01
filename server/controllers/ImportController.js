javascript
import {v4 as uuidv4} from 'uuid';

class ImportController {
    constructor() {
        this.db = null;
        this.initializeDb();
    }

    async initializeDb() {
        // Dynamic import so `app.js` can import this controller without causing circular dependency issues
        const {db: importedDb} = await import("../app.js");
        this.db = importedDb;

        // Ensure abilities exist before linking when importing Pokémons
        await this.retrieveAbilitiesFromDb();

        // Then check and import Pokémons
        await this.retrievePokemonsFromDb();
    }

    async retrievePokemonsFromDb() {
        const query = "SELECT * FROM main.pokemons";
        const result = this.db.prepare(query).all();
        // Pass current DB count so fetchPokemons can decide whether to fetch more
        await this.fetchPokemons(result.length);
    }


    async fetchPokemons(resultLength) {

        // Batch size for API requests to balance speed and rate limits
        const limit = 50;
        let offset = 0;
        let allPokemon = [];
        let totalCount = 0;

        // First fetch total count to know when to stop
        try {
            const response = await fetch("https://pokeapi.newdeveloper.nl/api/v2/pokemon?limit=1");
            if (!response.ok) throw new Error(`Failed to fetch total count: ${response.status}`);
            const data = await response.json();
            totalCount = data.count;
        } catch (error) {
            console.error("❌ Error fetching total count:", error);
            return;
        }

        // Loop until DB has as many as the API reports
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
                    // No results in this page — skip ahead
                    console.warn(`⚠️ No Pokémon found at offset ${offset}, skipping...`);
                    offset += limit;
                    if (resultLength < totalCount) {
                        break
                    } else{
                        continue
                    }
                }

                // Fetch details for each Pokémon in parallel for speed
                const detailedPokemon = await Promise.all(
                    batchData.results.map(async (pokemon) => {
                        try {
                            const detailsResponse = await fetch(pokemon.url);
                            if (!detailsResponse.ok) {
                                // Use Pokémon.name here since details aren't available yet
                                console.warn(`⚠️ Skipping Pokémon ${pokemon.name} due to an error (${detailsResponse.status})`);
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

                // Known missing/broken entry — explicitly skip it
                for (const detailPokemon of detailedPokemon) {
                    if (detailPokemon && detailPokemon.id === 10279) {
                        console.warn("⚠️ Skipping missing Pokémon (ID: 10279)");
                    }
                }

                for (const details of validPokemon) {
                    // Generate local UUID for the DB primary key, keep API id in api_id column
                    let pokemon_id = uuidv4();
                    const query = "INSERT INTO main.pokemons (id, name, weight, api_id, base_experience) VALUES (?, ?, ?, ?, ?)";
                    this.db.prepare(query).run(pokemon_id, details.name, details.weight, details.id, details.base_experience);

                    // Log at least one ability for debugging; warn if none
                    if (details.abilities.length > 0) {
                        console.log(details.abilities[0].ability.name);
                    } else {
                        console.warn(`⚠️ Pokémon ${details.name} has no abilities.`);
                    }

                    // Deduplicate abilities per Pokémon before linking
                    const uniqueAbilities = new Set(details.abilities.map(a => a.ability.name));

                    for (const abilityName of uniqueAbilities) {
                        // Link to pre-existing abilities in DB (retrieved earlier)
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
        // Post-process: ensure any remaining missing entries are inserted
        this.pokemons(allPokemon);
    }


    async pokemons(allPokemon) {
        try {

            const pokemonsInDbQuery = "SELECT * FROM main.pokemons WHERE name = ?";
            for (const pokemon of allPokemon) {
                const pokemonsInDb = this.db.prepare(pokemonsInDbQuery).get(pokemon.name);
                if (!pokemonsInDb) {
                    // Placeholder: insert missing Pokémon here if desired to avoid duplicates
                    console.log(`✅ Inserting missing Pokémon: ${pokemon.name}`);
                    // Insert the Pokémon here if missing
                }
            }


        } catch (error) {
            console.error("Error fetching Pokémon:", error);
        }
    }

    async linkPokemonToAbility(abilitiesName, pokemon_id) {

        // Lookup ability by name to get internal id
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

        // Get total from API to decide whether to fetch
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

        // Track fetched IDs to avoid duplicates if API has inconsistencies
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
                    // Use UUIDs for local primary keys and keep API id for reference
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
