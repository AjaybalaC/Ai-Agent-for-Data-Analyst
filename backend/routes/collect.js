const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { runAgent } = require('../agents/dataCollectorAgent');



router.post('/', async (req, res) => {
  const { query } = req.body;

  try {
    const data = await runAgent(query);
  
    const newQuery = new Query(
      { 
        userQuery: query, 
        collectedData: data 
      });

    await newQuery.save();
    
    res.json({ success: true, data });
  } 
  catch (error) {
   
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;