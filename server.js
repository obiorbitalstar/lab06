'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Global Variables
let searchQuery = '';
let latitude = '';
let longitude = '';

// Setup
const PORT = process.env.PORT || 3001;
// if the APIs are not working, delete any whitespaces in the .env file
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
const app = express();
app.use(cors());

// Endpoints
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.get('/parks', handleParksRequest);
app.use('*', handleErrorNotFound);

// Handle Functions
function handleLocationRequest(req, res) {
  searchQuery = req.query.city;

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

  superagent.get(url).then(resData => {
    // console.log(resData.body[0]); //then we target with index if needed
    const location = new Location(searchQuery, resData.body[0]);
    latitude = location.latitude;
    longitude = location.longitude;
    // console.log(location);
    res.status(200).send(location);
  }).catch((error) => {
    console.log('error', error);
    res.status(500).send('something went wrong');
  });
}

function handleWeatherRequest(req, res) {

  /////instead of global searchQuery and lat and lon
  // let searchQuery = req.query.city OR req.query.search_query;
  // let lat = req.query.latitude; //can be found found in Inspect Element -> Network -> Headers
  // let lon = req.query.longitude;
  // OR
  // const { latitude, longitude } = req.query; // will make two variables similar to above // called destructuring assignment

  // const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${searchQuery}&key=${WEATHER_API_KEY}`;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;


  if (!searchQuery) { //for empty request
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
  const url = `https://developer.nps.gov/api/v1/parks?limit=10&q=${searchQuery}&api_key=${PARKS_API_KEY}`;

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superagent.get(url).then(resData => {
    const parksData = [];

    resData.body.data.map(park => {
      parksData.push(new Park(park));
    });
    console.log(parksData);
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

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

