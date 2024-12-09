const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 코드 가져오기

router.get('/reviewfetch', (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    console.error("User ID is missing in request");
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `
    SELECT * FROM review
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching latest review:", err);
      return res.status(500).json({ error: "Failed to fetch latest review" });
    }

    if (results.length === 0) {
      return res.status(200).json({ message: "No reviews found" });
    }

    res.status(200).json(results[0]);
  });
});


  
router.post('/reviewinput', (req, res) => {
  const { user_id, strengths, improvements } = req.body;

  if (!user_id) {
    console.error("User ID is missing in the request body");
    return res.status(400).json({ error: 'User ID is required' });
  }

  const fetchLatestQuery = `
    SELECT id FROM review
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(fetchLatestQuery, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching latest review ID:", err);
      return res.status(500).json({ error: "Failed to fetch latest review ID" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No review found for the user" });
    }

    const latestReviewId = results[0].id;

    const updateQuery = `
      UPDATE review
      SET achievement = ?, improvement = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [strengths, improvements, latestReviewId], (err) => {
      if (err) {
        console.error("Error updating review:", err);
        return res.status(500).json({ error: "Failed to update review" });
      }

      res.status(200).json({ message: "Review updated successfully" });
    });
  });
});

  
  module.exports = router;