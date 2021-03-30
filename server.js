'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const cors = require('cors');

///
// install pg package
// setup url for database connections in .env
// connect the server with postgresql
//create endpoint that will take the users info and create a new user in the DB
//create an endpoint for retrieving all the user info


// Global Variables
// let searchQuery = '';
// let latitude = '';
// let longitude = '';

// Setup
const PORT = process.env.PORT || 3001;
// if the APIs are not working, delete any whitespaces in the .env file
const DATABASE_URL = process.env.DATABASE_URL;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
const app = express();
app.use(cors());

///// database connection setup
const client = new pg.Client(DATABASE_URL);

// Endpoints
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.get('/parks', handleParksRequest);
app.use('*', handleErrorNotFound);

// Handle Functions

function handleLocationRequest(req, res) {
  const searchQuery = req.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${searchQuery}&format=json`;
  // OR
  // const url = 'url as string';
  // const queryParam = {
  //   key: GEO_CODE_API_KEY,
  //   city: searchQuery,
  //   format: 'json',
  // }
  // then we pass it in the super agent superagent.get(url).query(queryParam).then(resData etc etc...

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  const sqlQuery = `SELECT * FROM cities`;
  client.query(sqlQuery).then(result => {
    // console.log(result.rows[0].search_query);
    let sqlCheck = false;
    result.rows.forEach(entry => {
      if (entry.search_query === searchQuery) {
        sqlCheck = true;
        console.log('from db');
        res.status(200).send(entry);
      }
    });
    if (!sqlCheck) {
      console.log('new entry');
      superagent.get(url).then(resData => {
        // console.log(resData.body[0]); //then we target with index if needed
        const location = new Location(searchQuery, resData.body[0]);
        // latitude = location.latitude;
        // longitude = location.longitude;
        // console.log(location);

        ////// Insert to table
        const safeValues = Object.values(location);
        const sqlQuery = `INSERT INTO cities(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
        client.query(sqlQuery, safeValues).then(result => {
          res.status(200).json(result);
        }).catch(error => {
          console.log('error', error);
          res.status(500).send('internal server error');
        });

        res.status(200).send(location);
      }).catch((error) => {
        console.log('error', error);
        res.status(500).send('something went wrong');
      });
    }
  }).catch(error => {
    console.log('error', error);
    res.status(500).send('internal server error');
  });

}

function handleWeatherRequest(req, res) {

  /////instead of global searchQuery and lat and lon
  // let searchQuery = req.query.city OR req.query.search_query;
  // let lat = req.query.latitude; //can be found found in Inspect Element -> Network -> Headers
  // let lon = req.query.longitude;
  // OR
  const { search_query, latitude, longitude } = req.query; // will make two variables similar to above // called destructuring assignment

  // const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${searchQuery}&key=${WEATHER_API_KEY}`;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;


  if (!search_query) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superagent.get(url).then(resData => {
    // console.log(resData.body); //then we target with index if needed

    const weatherData = [];
    resData.body.data.map(weather => {
      weatherData.push(new Weather(weather));
    });
    /////// Correct way for .map()
    // const weatherData = resData.body.data.map(weather => {
    //   return new Weather(weather);
    // })

    res.status(200).send(weatherData);
  }).catch((error) => {
    console.log('error', error);
    res.status(500).send('something went wrong');
  });
}

function handleParksRequest(req, res) {
  const searchQuery = req.query.search_query;
  const url = `https://developer.nps.gov/api/v1/parks?limit=10&q=${searchQuery}&api_key=${PARKS_API_KEY}`;

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superagent.get(url).then(resData => {
    const parksData = [];

    resData.body.data.map(park => {
      parksData.push(new Park(park));
    });
    // console.log(parksData);
    res.status(200).send(parksData);
  }).catch((error) => {
    console.log('error', error);
    res.status(500).send('something went wrong');
  });
}



// Constructors
function Location(searchQuery, data) {
  this.search_query = searchQuery; //taken from the request, and we add it as parameter as well
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = data.valid_date;
}

function Park(data) {
  this.name = data.fullName;
  this.address = `${data.addresses[0].line1}, ${data.addresses[0].city}, ${data.addresses[0].stateCode} ${data.addresses[0].postalCode}`;
  this.fee = data.entranceFees[0].cost || '0.00';
  this.description = data.description;
  this.url = data.url;
}

//////
function handleErrorNotFound(req, res) {
  res.status(404).send('Sorry, something went wrong');
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('connected to db', client.connectionParameters.database); //show what database we are connected to
    console.log(`Listening to Port ${PORT}`);
  });
}).catch(error => {
  console.log('error', error);
});

