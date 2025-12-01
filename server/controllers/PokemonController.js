import {v4 as uuidv4} from "uuid";

class PokemonController {
    static db = null; // Store the database connection

    static async initializeDb() {
        if (!this.db) {
            const { db: importedDb } = await import("../app.js");            this.db = importedDb;
            console.log("✅ Database initialized");
        }
    }

    static async getPokemons(orderBy = "api_id", order = "ASC") {
        // Make sure the database connection is initialized before we query it
        await this.initializeDb();

        // Whitelist of allowed columns to order by (prevents SQL injection)
        const allowedColumns = ["api_id", "name", "type"];
        if (!allowedColumns.includes(orderBy)) {
            throw new Error("Invalid orderBy column"); // Stop if user passes an unknown column
        }

        // Normalize the 'order' value (only ASC or DESC allowed)
        order = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

        // Build the SQL query dynamically using the validated inputs
        const query = `SELECT *
                   FROM main.pokemons
                   ORDER BY ${orderBy} ${order}`;

        // Execute the query and return all results
        const result = this.db.prepare(query).all();

        return result;
    }

    static async getPokemonById(id) {
        await this.initializeDb();
        const query = "SELECT * FROM main.pokemons WHERE id = ?";
        const result = this.db.prepare(query).get(id);

        return result;
    }

    static async searchPokemon(query) {
        await this.initializeDb();
        const query_Pokemons = `SELECT *
                                FROM main.pokemons
                                WHERE name LIKE ?`;
        const result = this.db.prepare(query_Pokemons).all(`%${query}%`); // Match only names that START with the prefix

        return result;
    }

    static async linkPokemonToUser(pokemon, favorites, user_id) {

        // Normalize the Pokémon name to lowercase for consistent database matching
        pokemon = pokemon.toLowerCase();

        // Ensure the database connection is initialized
        await this.initializeDb();

        // Clean up the input (remove extra spaces)
        let searchValue = pokemon.trim();

        // Look up the Pokémon by name in the database
        const query_addPokemons = 'SELECT * FROM main.pokemons WHERE name = ?';
        let result = this.db.prepare(query_addPokemons).get(searchValue);

        // Convert "favorites" string ("true"/"false") to numeric boolean (1/0)
        let favorite = 0;
        if (favorites === 'false') {
            favorite = 0;
        } else {
            favorite = 1;
        }

        // If the Pokémon exists, link it to the user in the junction table
        if (result) {
            const query_addLink = 'INSERT INTO pokemon_user (id, pokemon_id, user_id, favorite) VALUES (?, ?, ?, ?)';
            this.db.prepare(query_addLink).run(uuidv4(), result.id, user_id, favorite);
        } else {
            // Log an error if no Pokémon with the given name was found
            console.log("❌ Pokémon not found:", searchValue);
        }
    }

    static async retrieveFavoritePokemons(user_id) {
        await this.initializeDb();
        const query = 'SELECT * FROM pokemon_user WHERE user_id = ?';
        let pokemons = this.db.prepare(query).all(user_id);
        const favorite_pokemons = []
        const pokemon_id = pokemons.map(row => row.pokemon_id)
        for (let pokemon of pokemon_id) {
            const retrieve_pokemons_query = 'SELECT * FROM main.pokemons WHERE id = ?';
            let retrieve_favorite_pokemon = this.db.prepare(retrieve_pokemons_query).get(pokemon);
            favorite_pokemons.push(retrieve_favorite_pokemon)
        }

        return {"favorite_pokemons": favorite_pokemons, "info_pokemon_user": pokemons};

    }

    static async removeFavoritePokemon(pokemon, user_id) {
        await this.initializeDb();
        let errors = []
        const query = 'SELECT id FROM main.pokemons WHERE name = ?';
        const pokemon_id = this.db.prepare(query).get(pokemon)
        console.log('✅ retrieved pokemon id', pokemon_id)

        const update_favorite_pokemon_query = "UPDATE pokemon_user SET favorite  = 0 WHERE user_id = ? AND pokemon_id = ? AND favorite = 1"
        let update_favorite_pokemon = this.db.prepare(update_favorite_pokemon_query).run(user_id, pokemon_id.id)
        if (update_favorite_pokemon.changes === 0) {
            errors.push(pokemon + " not found as favorite")
        }
        if (errors.length === 0) {
            return "pokemons removed from favorite"
        } else {
            return errors
        }
    }

    static async removeUserPokemon(pokemon, user_id) {
        await this.initializeDb();
        let errors = []
        const query = 'SELECT id FROM main.pokemons WHERE name = ?';
        const pokemon_id = this.db.prepare(query).get(pokemon)
        console.log('✅ retrieved pokemon id', pokemon_id)

        const remove_pokemon_query = "DELETE FROM pokemon_user WHERE user_id = ? AND pokemon_id = ?"
        let remove_pokemon = this.db.prepare(remove_pokemon_query).run(user_id, pokemon_id.id)
        if (remove_pokemon.changes === 0) {
            console.error(pokemon + " not found in inventory")
            errors.push(pokemon + " not found in inventory")
        }
        if (errors.length === 0) {
            return "pokemons removed from favorite"
        } else {
            return errors
        }
    }

}

export default PokemonController;

