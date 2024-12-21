import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const API_URL = "https://api.coingecko.com/api/v3";

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//error handling functiom
const handleAPIError = (error, res) => {

    //error messages
    if (error.response) {
        //The request was made and the server responded with a status code
        switch (error.response.status) {
            case 404:
                return "Cryptocurrency not found. Please check the ID and try again.";
            case 429:
                return "Too many requests. Please wait a moment and try again.";
            case 500:
                return "Server error. Please try again later.";
            default:
                return "An unexpected error occurred while fetching cryptocurrency data.";
        }
    } else if (error.request) {
        //The request was made but no response was received
        return "No response from the server. Please check your internet connection.";
    } else {
        //Something happend during the process of setting up the request
        return "Error setting up the request. Please try again.";
    }
}

//Fetch top 10 cryptocurrencies by market cap in USD

app.get ("/", async (req, res) => {
    try {
        const result = await axios.get(API_URL + "/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 10,
                page: 1,
                sparkline: false
            },
            timeout: 10000 //10 seconds
        });

        // Render the index page with cryptocurrency data
        res.render('index', { 
            cryptocurrencies: result.data 
          });
    }
    catch (error) {
        console.error("Error fetching cryptocurrency data:", error);
        res.render ("index", {
            cryptocurrencies: [],
            error: "Unable to fetch cryptocurrency data"   
        });
    }
});

// Specific cryptocurrency search route
app.get ("/search-crypto", async (req, res) => {
    const coinId = req.query.coinId;

    if (!coinId) { // Correct check for empty/missing ID
        return res.render("index", {
            cryptocurrencies: [],
            error: "Please provide a cryptocurrency ID"
        });
    }

    // Fetch specific cryptocurrency data
    try {
        const response = await axios.get(API_URL + "/coins/markets", {
            params: {
                vs_currency: 'usd',
                ids: coinId,
                order: 'market_cap_desc',
                per_page: 1,
                page: 1,
                sparkline: false
            },
            timeout: 10000
        });

        // Check if any data was returned
        if (response.data.length === 0) {
            return res.render("index", {
                cryptocurrencies: [],
                error: `No data was found for crytocurreny: ${coinId}`
            });
        }

        res.render ("index", {
            cryptocurrencies: response.data,
            searchedCoin: coinId
        });
    } catch (error) {
        console.error(`Error fetching data for ${coinId}`, error);
        res.render ("index", {
            cryptocurrencies: [],
            error:`Unable to fetch data for ${coinId}`
        })
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

