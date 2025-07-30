const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const authorizeTokens = require('../middleware/checkTokens');
 
const updateNearbyBalance = async (userId, tokensUsed) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId }
    });

    if (subscription) {
      const updatedBalance = subscription.searchTokens - tokensUsed;
      const updatedSubscription = await prisma.subscription.update({
        where: { userId: userId },
        data: { searchTokens: updatedBalance },
      });

      return updatedSubscription;
    }
  } catch (error) {
    console.error("Error updating nearby balance:", error);
  }
};

router.get('/nearby', authorizeTokens, (req, res) => {
  const userId = req.user.userId;
  const { lat, lng, radius, category, requestedTokens } = req.query;

  const nearbySearchUrl = `https://places.googleapis.com/v1/places:searchNearby?key=${process.env.GOOGLE_MAPS_KEY}`;
  const requestBody = {
    includedTypes: [category],
    maxResultCount: requestedTokens ? parseInt(requestedTokens) : 10,
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
  ).then(async (response) => {
    let updatedSubscription;
    if (response.data.places && response.data.places.length > 0) {
      updatedSubscription = await updateNearbyBalance(userId, response.data.places.length);
    }

    res.json({
      message: 'Places fetched successfully', 
      places: response.data.places ? [...response.data.places] : [],
      updatedSubscription: updatedSubscription || null
    });
  }).catch((error) => {
    console.error("Error fetching places:", error);
    res.status(500).send("Error fetching places");
  });
});

router.get('/text', authorizeTokens, async (req, res) => {
  const userId = req.user.userId;
  const { lat, lng, radius, query, requestedTokens } = req.query;

  const textSearchUrl = `https://places.googleapis.com/v1/places:searchText?key=${process.env.GOOGLE_MAPS_KEY}`;
  const requestBody = {
    textQuery: query,
    pageSize: requestedTokens ? parseInt(requestedTokens) : 10,
    locationBias: {
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
    `${textSearchUrl}&fields=places.displayName,places.websiteUri,places.location,places.id,places.googleMapsUri,places.addressComponents`,
    requestBody
  ).then(async (response) => {
    let updatedSubscription;
    if (response.data.places && response.data.places.length > 0) {
      // Deduct the tokens from user account
      updatedSubscription = await updateNearbyBalance(userId, response.data.places.length);
      console.log("Text search balance updated successfully", response.data.places.length, updatedSubscription);
    }

    res.json({
      message: 'Places fetched successfully', 
      places: response.data.places ? [...response.data.places] : [],
      updatedSubscription: updatedSubscription || null
    });
  }).catch((error) => {
    console.error("Error fetching places:", error.response ? error.response.data : error.message);
    res.status(500).send("Error fetching places");
  });
})

module.exports = router;