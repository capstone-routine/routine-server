const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 코드 가져오기

router.get('/routinefetch', (req, res) => {
    const { user_id } = req.query;
  
    if (!user_id) {
      console.error("User ID is missing in request");
      return res.status(400).send({ error: 'User ID is required' });
    }
  
    console.log("Fetching routines for user_id:", user_id);
  
    // 콜백 방식으로 쿼리 실행
    db.query('SELECT * FROM routine WHERE user_id = ?', [user_id], (error, results) => {
      if (error) {
        console.error('Error fetching routines:', error.message);
        return res.status(500).send({ error: 'Failed to fetch routines' });
      }
  
      if (results.length === 0) {
        console.log("No routines found for user ID:", user_id);
        return res.status(200).send({ tasks: [] });
      }
  
      console.log("Routines fetched successfully:", results);
      res.status(200).send({ tasks: results });
    });
  });

  router.post("/routinesave", (req, res) => {
    const { user_id, type, content, is_completed } = req.body;

    if (!user_id || !type || !content || is_completed === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the lowest available ID between 0 and 9
    const findLowestIdQuery = `
        SELECT id FROM routine WHERE user_id = ? ORDER BY id ASC
    `;

    db.query(findLowestIdQuery, [user_id], (findErr, results) => {
        if (findErr) {
            console.error("Error finding lowest ID:", findErr);
            return res.status(500).json({ error: "Failed to find lowest available ID" });
        }

        const existingIds = results.map((row) => row.id);
        let newId = -1;

        for (let i = 0; i <= 9; i++) {
            if (!existingIds.includes(i)) {
                newId = i;
                break;
            }
        }

        if (newId === -1) {
            return res.status(400).json({ error: "No available ID slots. Maximum 10 tasks allowed." });
        }

        // Insert the new task with the calculated ID
        const insertQuery = `
            INSERT INTO routine (id, user_id, type, content, is_completed)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [newId, user_id, type, content, is_completed], (insertErr, result) => {
            if (insertErr) {
                console.error("Error inserting new task:", insertErr);
                return res.status(500).json({ error: "Failed to save the task" });
            }

            console.log("Task saved successfully with ID:", newId);
            res.status(200).json({ message: "Task added successfully", id: newId });
        });
    });
});

  
router.put('/routinetoggle', (req, res) => {
  const { id, user_id } = req.body;

  if (id === undefined || user_id === undefined) {
    return res.status(400).json({ error: "Missing id or user_id" });
  }

  const query = `UPDATE routine SET is_completed = NOT is_completed WHERE id = ? AND user_id = ?`;
  db.query(query, [id, user_id], (error, results) => {
    if (error) {
      console.error("Database update error:", error);
      return res.status(500).json({ error: "Database update failed" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task toggled successfully" });
  });
});

  
  router.delete("/routinedelete", (req, res) => {
    const { id, user_id } = req.body;

    console.log("Delete request received:", req.body); // 디버깅용

    if (typeof id === "undefined" || typeof user_id === "undefined") {
        return res.status(400).json({ error: "Missing required fields: id and user_id are required" });
    }

    // Step 1: 지우고자하는 항 지우기
    const deleteQuery = `DELETE FROM routine WHERE id = ? AND user_id = ?`;
    db.query(deleteQuery, [id, user_id], (deleteErr, deleteResult) => {
        if (deleteErr) {
            console.error("Error deleting task:", deleteErr);
            return res.status(500).json({ error: "Failed to delete the task" });
        }

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        console.log("Task deleted successfully");

        // Step 2: 지우는 항보다 id 행값이 높으면 1씩 낮추기
        const updateQuery = `UPDATE routine SET id = id - 1 WHERE id > ? AND user_id = ?`;
        db.query(updateQuery, [id, user_id], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating IDs:", updateErr);
                return res.status(500).json({ error: "Failed to update IDs" });
            }

            console.log("IDs updated successfully");
            res.status(200).json({ message: "Task deleted and IDs updated successfully" });
        });
    });
});

router.delete('/routinereset', (req, res) => {
  const { user_id } = req.body; // 요청에서 user_id를 받아옵니다.
  console.log("Routine reset 요청 수신:", req.body);

  if (!user_id) {
    console.error("user_id가 요청에 포함되지 않았습니다.");
    return res.status(400).json({ error: "user_id가 필요합니다." });
  }

  const query = `DELETE FROM routine WHERE user_id = ?`;
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error("Routine 삭제 오류:", err);
      return res.status(500).json({ error: "루틴 초기화에 실패했습니다." });
    }

    console.log("모든 루틴 삭제 성공, 삭제된 행 수:", result.affectedRows);
    res.status(200).json({ message: "루틴 초기화 성공" });
  });
});


router.post("/routinesubmit", async (req, res) => {
  const { user_id, success_rate, achievement, improvement } = req.body;

  console.log("Received Data:", req.body);

  if (!user_id || success_rate === undefined) {
    return res.status(400).json({ message: "Invalid data received" });
  }

  // Step 1: Find the lowest available ID
  const findLowestIdQuery = `
    SELECT id FROM review WHERE user_id = ? ORDER BY id ASC
  `;

  db.query(findLowestIdQuery, [user_id], (findErr, results) => {
    if (findErr) {
      console.error("Error finding lowest ID:", findErr);
      return res.status(500).json({ error: "Failed to find lowest available ID" });
    }

    const existingIds = results.map((row) => row.id);
    let newId = -1;

    for (let i = 0; i <= 9; i++) {
      if (!existingIds.includes(i)) {
        newId = i;
        break;
      }
    }

    if (newId === -1) {
      return res.status(400).json({ error: "No available ID slots. Maximum 10 reviews allowed." });
    }

    // Step 2: Insert the review with the calculated ID
    const insertQuery = `
      INSERT INTO review (id, user_id, success_rate, achievement, improvement, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(
      insertQuery,
      [newId, user_id, success_rate, achievement || null, improvement || null],
      (insertErr, result) => {
        if (insertErr) {
          console.error("Error inserting review:", insertErr);
          return res.status(500).json({ error: "Failed to save the review" });
        }

        console.log("Review saved successfully with ID:", newId);
        res.status(200).json({ message: "Review added successfully", id: newId });
      }
    );
  });
});


module.exports = router;