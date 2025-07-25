const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const authorizeTokens = require('../middleware/checkTokens');

router.get('/nearby', authorizeTokens, (req, res) => {
  const { lat, lng, radius, category, requestedTokens } = req.query;
  console.log(lat, lng, radius, category, requestedTokens);

  const nearbySearchUrl = `https://places.googleapis.com/v1/places:searchNearby?key=${process.env.GOOGLE_MAPS_KEY}`;

  const requestBody = {
    includedTypes: [category],
    maxResultCount: maxResultCount ? parseInt(maxResultCount) : 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: radius
      }
    }
  };

  axios.post(
    `${nearbySearchUrl}&fields=places.displayName,places.websiteUri,places.location,places.id,places.googleMapsUri,places.addressComponents`,
    requestBody
  ).then((response) => {
    let updatedBalanceUser;
    if (response.data.places && response.data.places.length > 0) {
      console.log("Nearby places fetched successfully:", response.data.places.length);
      // Deduct the tokens from user account
      // updatedBalanceUser = updateNearbyBalance(req.user.id, response.data.places.length);
      // console.log("Nearby balance updated successfully");
    }

    res.json({
      message: 'Places fetched successfully', 
      places: response.data.places ? [...response.data.places] : [],
      // newTokenBalance: updatedBalanceUser ? updatedBalanceUser.nearbyBalance : null
    });
  }).catch((error) => {
    console.error("Error fetching places:", error);
    res.status(500).send("Error fetching places");
  });
});

module.exports = router;