const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 코드 가져오기

router.get('/session', (req, res) => {
    const query = `SELECT user_id FROM session LIMIT 1`; // 현재 로그인된 사용자의 세션만 가져오도록 설정
    db.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching session:", error);
            res.status(500).json({ error: "Failed to fetch session data" });
        } else {
            if (results.length > 0) {
                res.json({ user_id: results[0].user_id });
            } else {
                res.status(404).json({ error: "No active session found" });
            }
        }
    });
});

// 특정 사용자의 목적 데이터 조회 API
router.get('/purposefetch', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "user_id가 누락되었습니다." });
    }

    try {
        const query = `
            SELECT purpose_1_title, purpose_1_content, purpose_2_title, purpose_2_content, purpose_3_title, purpose_3_content
            FROM purpose
            WHERE user_id = ?
        `;
        const [rows] = await db.promise().query(query, [user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "해당 사용자의 목적 데이터가 없습니다." });
        }

        const result = {
            mainGoals: [
                rows[0].purpose_1_title || '',
                rows[0].purpose_2_title || '',
                rows[0].purpose_3_title || '',
            ],
            achievedLists: [
                rows[0].purpose_1_content || '',
                rows[0].purpose_2_content || '',
                rows[0].purpose_3_content || '',
            ],
        };

        res.status(200).json(result);
    } catch (error) {
        console.error("목적 데이터 조회 중 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

router.post('/purposeupdate', async (req, res) => {
    const { selectedNumber, mainGoal, achievedList } = req.body;

    if (!selectedNumber || !mainGoal || !achievedList) {
        return res.status(400).json({ message: "필수 데이터가 누락되었습니다." });
    }

    try {
        // 세션 확인 (로그인된 사용자 가져오기)
        const sessionQuery = 'SELECT user_id FROM session LIMIT 1';
        db.query(sessionQuery, (sessionErr, sessionResult) => {
            if (sessionErr) {
                console.error('세션 확인 중 오류 발생:', sessionErr);
                return res.status(500).json({ message: '서버 오류' });
            }

            if (sessionResult.length === 0) {
                return res.status(401).json({ message: '로그인되지 않았습니다.' });
            }

            const userId = sessionResult[0].user_id;

            // 컬럼명 동적 설정
            const columnContent = `purpose_${selectedNumber}_content`;
            const columnTitle = `purpose_${selectedNumber}_title`;

            // 기존 데이터 확인
            const checkQuery = 'SELECT * FROM purpose WHERE user_id = ?';
            db.query(checkQuery, [userId], (checkErr, checkResult) => {
                if (checkErr) {
                    console.error('데이터 확인 중 오류 발생:', checkErr);
                    return res.status(500).json({ message: '서버 오류' });
                }

                if (checkResult.length > 0) {
                    // 기존 데이터가 있는 경우 업데이트
                    const updateQuery = `
                        UPDATE purpose
                        SET ${columnContent} = ?, ${columnTitle} = ?, updated_at = NOW()
                        WHERE user_id = ?
                    `;
                    db.query(updateQuery, [achievedList, mainGoal, userId], (updateErr) => {
                        if (updateErr) {
                            console.error('데이터 업데이트 중 오류 발생:', updateErr);
                            return res.status(500).json({ message: '서버 오류' });
                        }
                        return res.status(200).json({ message: '목적이 성공적으로 업데이트되었습니다.' });
                    });
                } else {
                    // 기존 데이터가 없는 경우 새로 삽입
                    const insertQuery = `
                        INSERT INTO purpose (user_id, ${columnContent}, ${columnTitle}, created_at, updated_at)
                        VALUES (?, ?, ?, NOW(), NOW())
                    `;
                    db.query(insertQuery, [userId, achievedList, mainGoal], (insertErr) => {
                        if (insertErr) {
                            console.error('데이터 삽입 중 오류 발생:', insertErr);
                            return res.status(500).json({ message: '서버 오류' });
                        }
                        return res.status(201).json({ message: '목적이 성공적으로 저장되었습니다.' });
                    });
                }
            });
        });
    } catch (err) {
        console.error('서버 오류:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

router.post('/purposedelete', (req, res) => {
    const { user_id, selectedNumber } = req.body;

    if (!user_id || !selectedNumber) {
        return res.status(400).json({ message: "필수 데이터가 누락되었습니다." });
    }

    // 동적으로 컬럼 이름 결정
    const columnContent = `purpose_${selectedNumber}_content`;
    const columnTitle = `purpose_${selectedNumber}_title`;

    // DELETE 대신 UPDATE로 특정 컬럼만 NULL 처리
    const query = `
        UPDATE purpose
        SET ${columnContent} = NULL, ${columnTitle} = NULL
        WHERE user_id = ?
    `;

    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error("데이터 삭제 중 오류 발생:", err);
            return res.status(500).json({ message: "서버 오류" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No data found to delete." });
        }

        res.status(200).json({ message: "데이터가 성공적으로 삭제되었습니다." });
    });
});


module.exports = router;