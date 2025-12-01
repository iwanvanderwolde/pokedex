// server/controllers/PokemonController.js
import {v4 as uuidv4} from "uuid";

class PokemonController {
    static db = null;

    static async initializeDb() {
        if (!this.db) {
            // Dynamic import to avoid circular dependency at module load time
            const { db: importedDb } = await import("../app.js");
            this.db = importedDb;
            console.log("✅ Database initialized");
        }
    }

    static async getPokemons(orderBy = "api_id", order = "ASC") {
        await this.initializeDb();

        // Whitelist column names to prevent SQL injection when building ORDER BY
        const allowedColumns = ["api_id", "name", "type"];
        if (!allowedColumns.includes(orderBy)) {
            throw new Error("Invalid orderBy column");
        }

        // Normalize a sort direction to only two allowed values
        order = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

        // Safe to interpolate here because inputs were validated above
        const query = `SELECT *
                   FROM main.pokemons
                   ORDER BY ${orderBy} ${order}`;

        return this.db.prepare(query).all();
    }

    static async getPokemonById(id) {
        await this.initializeDb();
        const query = "SELECT * FROM main.pokemons WHERE id = ?";
        return this.db.prepare(query).get(id);
    }

    static async searchPokemon(query) {
        await this.initializeDb();
        // Use LIKE with wildcards for basic substring search
        const query_Pokemons = `SELECT *
                                FROM main.pokemons
                                WHERE name LIKE ?`;
        // Surround with wildcards to match anywhere in the name
        return this.db.prepare(query_Pokemons).all(`%${query}%`);
    }

    static async linkPokemonToUser(pokemon, favorites, user_id) {
        // Normalize input to make lookups predictable
        pokemon = pokemon.toLowerCase();
        await this.initializeDb();

        // Trim whitespace from user input
        let searchValue = pokemon.trim();

        const query_addPokemons = 'SELECT * FROM main.pokemons WHERE name = ?';
        let result = this.db.prepare(query_addPokemons).get(searchValue);

        // Convert textual boolean to numeric (SQLite typically uses 0/1)
        let favorite = favorites === 'false' ? 0 : 1;

        if (result) {
            const query_addLink = 'INSERT INTO pokemon_user (id, pokemon_id, user_id, favorite) VALUES (?, ?, ?, ?)';
            // Use UUID for the junction table primary key
            this.db.prepare(query_addLink).run(uuidv4(), result.id, user_id, favorite);
        } else {
            // Keep logging minimal — useful when user input doesn't match DB
            console.log("❌ Pokémon not found:", searchValue);
        }
    }

    static async retrieveFavoritePokemons(user_id) {
        await this.initializeDb();
        const query = 'SELECT * FROM pokemon_user WHERE user_id = ?';
        let pokemons = this.db.prepare(query).all(user_id);

        // Collect full Pokémon rows for each saved pokemon_id
        const favorite_pokemons = [];
        const pokemon_id = pokemons.map(row => row.pokemon_id);
        for (let pokemon of pokemon_id) {
            const retrieve_pokemons_query = 'SELECT * FROM main.pokemons WHERE id = ?';
            let retrieve_favorite_pokemon = this.db.prepare(retrieve_pokemons_query).get(pokemon);
            favorite_pokemons.push(retrieve_favorite_pokemon);
        }

        return {"favorite_pokemons": favorite_pokemons, "info_pokemon_user": pokemons};
    }

    static async removeFavoritePokemon(pokemon, user_id) {
        await this.initializeDb();
        let errors = [];
        const query = 'SELECT id FROM main.pokemons WHERE name = ?';
        const pokemon_id = this.db.prepare(query).get(pokemon);
        console.log('✅ retrieved pokemon id', pokemon_id);

        // Update only entries that are currently marked as favorite
        const update_favorite_pokemon_query = "UPDATE pokemon_user SET favorite  = 0 WHERE user_id = ? AND pokemon_id = ? AND favorite = 1";
        let update_favorite_pokemon = this.db.prepare(update_favorite_pokemon_query).run(user_id, pokemon_id.id);
        if (update_favorite_pokemon.changes === 0) {
            errors.push(pokemon + " not found as favorite");
        }
        return errors.length === 0 ? "pokemons removed from favorite" : errors;
    }

    static async removeUserPokemon(pokemon, user_id) {
        await this.initializeDb();
        let errors = [];
        const query = 'SELECT id FROM main.pokemons WHERE name = ?';
        const pokemon_id = this.db.prepare(query).get(pokemon);
        console.log('✅ retrieved pokemon id', pokemon_id);

        // Remove any association between the user and the Pokémon
        const remove_pokemon_query = "DELETE FROM pokemon_user WHERE user_id = ? AND pokemon_id = ?";
        let remove_pokemon = this.db.prepare(remove_pokemon_query).run(user_id, pokemon_id.id);
        if (remove_pokemon.changes === 0) {
            console.error(pokemon + " not found in inventory");
            errors.push(pokemon + " not found in inventory");
        }
        return errors.length === 0 ? "pokemons removed from favorite" : errors;
    }

}

export default PokemonController;
