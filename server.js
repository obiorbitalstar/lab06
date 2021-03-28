'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const cors = require('cors');

// Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// Endpoints
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);

function handleLocationRequest(req, res) {
  const locationsRawData = require('./data/location.json');
  const locationsData = new Location(locationsRawData[0]);
  res.send(locationsData);
}

function handleWeatherRequest() {
  
}



// Constructors
function Location(data) {
  this.search_query = data.display_name.split(',')[0].toLowerCase();
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

app.use('*', (req, res) => {
  res.send('Hey there!');
});
app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
