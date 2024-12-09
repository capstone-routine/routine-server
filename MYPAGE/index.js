const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/userdata', async (req, res) => {
    try {
        // 세션 테이블에서 로그인된 사용자 ID 가져오기
        const sessionQuery = "SELECT user_id, user_name FROM session LIMIT 1"; // 예시로 하나의 사용자만 조회
        const sessionResult = await db.promise().query(sessionQuery);

        if (sessionResult[0].length === 0) {
            return res.status(404).json({ message: "No active session found" });
        }

        const userId = sessionResult[0][0].user_id;
        const userName = sessionResult[0][0].user_name;

        // usertype 테이블에서 해당 사용자의 유형 가져오기
        const userTypeQuery = "SELECT user_type FROM usertype WHERE user_id = ?";
        const userTypeResult = await db.promise().query(userTypeQuery, [userId]);

        if (userTypeResult[0].length === 0) {
            return res.status(404).json({ message: "User type not found" });
        }

        const userType = userTypeResult[0][0].user_type;

        // 사용자 이름과 유형 반환
        res.json({ userName, userType });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/myreviewfetch", (req, res) => {
    const { user_id } = req.query;
  
    const query = `
        SELECT success_rate, achievement, improvement
        FROM review
        WHERE user_id = ? 
    `;
  
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error("Error fetching review:", err);
            return res.status(500).json({ error: "Server error" });
        }
  
        if (results.length > 0) {
            console.log("Fetched review data:", results);
            res.json(results); // 모든 리뷰 데이터 반환
        } else {
            res.status(404).json({ error: "No reviews found" });
        }
    });
  });
  
  router.delete("/deletereview", (req, res) => {
    const { index, user_id } = req.body;

    console.log("Delete review request received:", req.body);

    if (typeof index === "undefined" || typeof user_id === "undefined") {
        return res.status(400).json({ error: "Missing required fields: index and user_id are required" });
    }

    // Step 1: 삭제할 리뷰 가져오기
    const selectQuery = `SELECT id FROM review WHERE user_id = ? LIMIT ?, 1`;
    db.query(selectQuery, [user_id, index], (selectErr, selectResult) => {
        if (selectErr || selectResult.length === 0) {
            console.error("Error finding review to delete:", selectErr);
            return res.status(500).json({ error: "Failed to find review to delete" });
        }

        const reviewId = selectResult[0].id;

        // Step 2: 리뷰 삭제
        const deleteQuery = `DELETE FROM review WHERE id = ? AND user_id = ?`;
        db.query(deleteQuery, [reviewId, user_id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error("Error deleting review:", deleteErr);
                return res.status(500).json({ error: "Failed to delete the review" });
            }

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: "Review not found" });
            }

            console.log("Review deleted successfully");

            // Step 3: ID 재정렬
            const updateQuery = `UPDATE review SET id = id - 1 WHERE id > ? AND user_id = ? ORDER BY id`;
            db.query(updateQuery, [reviewId, user_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating IDs:", updateErr);
                    return res.status(500).json({ error: "Failed to update IDs" });
                }

                console.log("IDs updated successfully");
                res.status(200).json({ message: "Review deleted and IDs updated successfully" });
            });
        });
    });
});


module.exports = router;
