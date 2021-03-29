'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const cors = require('cors');

// Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

// Global object
const error = {
  status: 500,
  responseText: 'Sorry, something went wrong'
};

// function ErrorNotFound(req, res) {
//   res.status(500).send('Sorry, something went wrong');
// }



// Endpoints
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);

function handleLocationRequest(req, res) {
  const searchQuery = req.query.city;

  // if (!searchQuery) {
  //   res.status(500).send('Sorry, something went wrong');
  // }

  // throw new Error('I didn't find any cities');

  const locationsRawData = require('./data/location.json');
  const locationsData = new Location(locationsRawData[0]);
  if (searchQuery === locationsData.search_query) {
    res.send(locationsData);
  } else {
    res.send(error);
  }

  // try {
  //   put above code here
  // } catch (error) {
  //   console.log(error);
  //   res.status(500).send('error');
  // }


}

function handleWeatherRequest(req, res) {
  const searchQuery = req.query.search_query;

  if (searchQuery === 'lynnwood') {
    const weatherRawData = require('./data/weather.json');
    const weatherData = [];

    weatherRawData.data.forEach(weather => {
      weatherData.push(new Weather(weather));
    });
    res.send(weatherData);
  } else {
    res.send(error);
  }
}



// Constructors
function Location(data) {
  this.search_query = data.display_name.split(',')[0].toLowerCase();
  // this.search_query = searchQuery; //taken from the request, and we add it as parameter as well
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = data.valid_date;
}

//////
app.use('*', (req, res) => {
  res.send('City Explorer!');
  // res.status(500).send('Sorry, something went wrong');
  // or
  // errorNotFound();
});
app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
