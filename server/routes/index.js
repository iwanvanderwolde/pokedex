import express from 'express';
import ImportController from "../controllers/ImportController.js";
import PokemonController from "../controllers/PokemonController.js";
import AuthenticationController from "../controllers/AuthenticationController.js";
import passport from 'passport';

const router = express.Router();


router.get('/', function (req, res, next) {
    ImportController.constructor();
    res.send('Hello world!');
});


router.get('/pokemons', async function (req, res, next) {
    try {
        const all_pokemons = await fetch(`https://pokeapi.newdeveloper.nl/api/v2/pokemon/`);

        const {orderBy = "api_id", order = "ASC"} = req.query; // Default sorting by api_id

        const pokemons = await PokemonController.getPokemons(orderBy, order);
        console.log(all_pokemons.json());
        res.json(pokemons);
    } catch (error) {
        console.error("Error fetching pokemons:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

router.get('/pokemon/get', async function (req, res, next) {
    try {
        const id = req.query.id;
        console.log("🔍 Fetching Pokémon with ID:", id);

        const pokemon = await PokemonController.getPokemonById(id);
        console.log("📄 Query Result:", pokemon);

        if (!pokemon) {
            return res.status(404).json({error: "Pokémon not found"});
        }

        res.json(pokemon);
    } catch (error) {
        console.error("❌ Error fetching Pokémon:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});


router.get('/pokemons/search', async function (req, res, next) {
    try {
        let {searchTerm} = req.query;
        if (!searchTerm) {
            return res.status(400).json({error: "Missing 'name' query parameter"});
        }

        const pokemons = await PokemonController.searchPokemon(searchTerm);
        res.json(pokemons);
    } catch (error) {
        console.error("Error searching Pokémon:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

router.post('/pokemons/register', async function (req, res, next) {
    try {
        const {username, email, password} = req.body;
        console.log("📩 Received request body:", req.body); // Debugging

        const users = await AuthenticationController.registerUser(username, email, password);

        console.log("✅ User registration response:", users); // Debugging
        res.status(201).json(users);
    } catch (error) {
        console.error("❌ Error in /pokemons/register:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

router.post('/pokemons/login', async function (req, res, next) {
    try {

        const {email_or_username, password} = req.body;
        console.log("📩 Received request body:", req.body); // Debugging
        const users = await AuthenticationController.loginUser(email_or_username, password);

        console.log("✅ User login response:", users); // Debugging
        res.status(200).json(users);
    } catch (error) {
        console.error("❌ Error in /pokemons/login:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

router.post('/pokemons/add', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
    try {
        const user_id = req.user.id;
        const pokemons = req.query.pokemon;
        const favorites = req.query.favorite;
        console.log("📩 Received request body:", pokemons, favorites);
        await PokemonController.linkPokemonToUser(pokemons, favorites, user_id);
        console.log("✅ User login response: ", user_id);
        res.status(200).json({message: "Pokemons added successfully"});
    } catch (error) {
        console.error("❌ Error in /pokemons/add:", error);
        res.status(500).json({error: "Internal server error"});
    }
})

router.get('/pokemons/favorite', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
    try {
        const user_id = req.user.id;
        let pokemons = []
        const favoritePokemon = await PokemonController.retrieveFavoritePokemons(user_id);
        res.status(200).json(favoritePokemon);
    } catch (error) {
        console.error("❌ Error in /pokemons/favorite:", error);
        res.status(500).json({error: "Internal server error"});
    }
})

router.post('/pokemons/favorite/remove', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
    try {
        const user_id = req.user.id;
        const {pokemon} = req.body
        console.log("🔄 received pokemons", pokemon, "and removing them from favorite")
        let removeFavoritePokemon = await PokemonController.removeFavoritePokemon(pokemon, user_id)
        console.log("✅ pokemon removed from favorite")
        console.log(removeFavoritePokemon)
        res.status(200).json({message: removeFavoritePokemon})
    } catch (error) {
        console.log("❌ Error in /pokemon/favorite/remove:", error)
        res.status(500).json({error: "Internal server error"})
    }
})

router.post('/pokemons/remove/user_pokemon', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
    try {
        const user_id = req.user.id;
        const {pokemon} = req.body
        console.log("🔄 received pokemons", pokemon, "and removing them from favorite")
        let removeFavoritePokemon = await PokemonController.removeUserPokemon(pokemon, user_id)
        console.log("✅ pokemon removed from favorite")
        console.log(removeFavoritePokemon)
        res.status(200).json({message: removeFavoritePokemon})
    } catch (error) {
        console.log("❌ Error in /pokemon/favorite/remove:", error)
        res.status(500).json({error: "Internal server error"})
    }
})

router.get('/pokemons/users_and_favorite_pokemons', async function (req, res, next) {

    let user_and_favorite_pokemon = {"user": [], "favorite_pokemons": []};
    const users = await AuthenticationController.getUsers();
    console.log(users)
    for (let i = 0; i < users.length; ) {
        let favorite_pokemon = await PokemonController.retrieveFavoritePokemons(users[i].id);
        user_and_favorite_pokemon.favorite_pokemons.push(favorite_pokemon.favorite_pokemons);
        user_and_favorite_pokemon.user.push(users[i].name);
        i++
    }
    res.status(200).json(user_and_favorite_pokemon);
});
    router.get('/auth', passport.authenticate('jwt', {session: false}), function (req, res, next) {

        res.send('auth');

    });
    export default router;
