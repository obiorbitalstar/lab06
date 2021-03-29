'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
// const { response } = require('express');
let searchQuery = '';

// Setup
const PORT = process.env.PORT || 3000;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const app = express();
app.use(cors());

// Global object
const error = {
  status: 500,
  responseText: 'Sorry, something went wrong'
};





// Endpoints
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.use('*', handleErrorNotFound);

function handleLocationRequest(req, res) {
  searchQuery = req.query.city;

  const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${searchQuery}&format=json`;
  //or
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
    // console.log(location);
    res.status(200).send(location);
  }).catch((error) => {
    console.log('error', error);
    res.status(500).send('something went wrong');
  });

  // if (!searchQuery) {
  //   res.status(500).send('Sorry, something went wrong');
  // }

  // throw new Error('I didn't find any cities');

  // const locationsRawData = require('./data/location.json');
  // const locationsData = new Location(locationsRawData[0]);
  // if (searchQuery === locationsData.search_query) {
  //   res.send(locationsData);
  // } else {
  //   res.send(error);
  // }

  // try {
  //   put above code here
  // } catch (error) {
  //   console.log(error);
  //   res.status(500).send('error');
  // }


}

function handleWeatherRequest(req, res) {
  // const searchQuery = req.query.search_query.city;
  console.log(searchQuery);
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${searchQuery}&key=${WEATHER_API_KEY}`;

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superagent.get(url).then(resData => {
    console.log(resData.body); //then we target with index if needed
    const weatherData = [];
    // res.send(resData.body[0]);

    // const location = new Location(searchQuery, resData.body[0]);
    // console.log(location);
    res.status(200).send(resData.body);
  }).catch((error) => {
    console.log('error', error);
    res.status(500).send('something went wrong');
  });

  // if (searchQuery === 'lynnwood') {
  //   const weatherRawData = require('./data/weather.json');
  //   const weatherData = [];

  //   weatherRawData.data.map(weather => {
  //     weatherData.push(new Weather(weather));
  //   });
  //   res.send(weatherData);
  // } else {
  //   res.send(error);
  // }
}



// Constructors
function Location(searchQuery, data) {
  // this.search_query = data.display_name.split(',')[0].toLowerCase();
  this.search_query = searchQuery; //taken from the request, and we add it as parameter as well
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = data.valid_date;
}

//////
function handleErrorNotFound(req, res) {
  res.status(404).send('Sorry, something went wrong');
}
// app.use('*', (req, res) => {
//   res.send('City Explorer!');
// });

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

