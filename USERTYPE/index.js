const express = require('express');
const router = express.Router();
const db = require('../db');

// 사용자 유형 저장 API
router.post('/usertype', async (req, res) => {
    const { type } = req.body;

    if (!type) {
        return res.status(400).json({ message: '유형 데이터가 누락되었습니다.' });
    }

    try {
        // 로그인 확인 (session 테이블 확인)
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

            // 기존 데이터 확인
            const checkQuery = 'SELECT * FROM usertype WHERE user_id = ?';
            db.query(checkQuery, [userId], (checkErr, checkResult) => {
                if (checkErr) {
                    console.error('데이터 확인 중 오류 발생:', checkErr);
                    return res.status(500).json({ message: '서버 오류' });
                }

                if (checkResult.length > 0) {
                    // 기존 데이터 업데이트
                    const updateQuery = 'UPDATE usertype SET user_type = ?, updated_at = NOW() WHERE user_id = ?';
                    db.query(updateQuery, [type, userId], (updateErr) => {
                        if (updateErr) {
                            console.error('데이터 업데이트 중 오류 발생:', updateErr);
                            return res.status(500).json({ message: '서버 오류' });
                        }
                        return res.status(200).json({ message: '결과가 성공적으로 업데이트되었습니다.' });
                    });
                } else {
                    // 새 데이터 삽입
                    const insertQuery = 'INSERT INTO usertype (user_id, user_type, updated_at) VALUES (?, ?, NOW())';
                    db.query(insertQuery, [userId, type], (insertErr) => {
                        if (insertErr) {
                            console.error('데이터 삽입 중 오류 발생:', insertErr);
                            return res.status(500).json({ message: '서버 오류' });
                        }
                        return res.status(201).json({ message: '결과가 성공적으로 저장되었습니다.' });
                    });
                }
            });
        });
    } catch (err) {
        console.error('서버 오류:', err);
        res.status(500).json({ message: '서버 오류' });
    }
});

router.get('/getusertype', async (req, res) => {
    try {
        // 세션에서 로그인 정보 확인
        const sessionQuery = 'SELECT user_id FROM session LIMIT 1';
        const [sessionResult] = await db.promise().query(sessionQuery);

        if (sessionResult.length === 0) {
            // 로그인되지 않은 경우 기본 응답 반환
            return res.status(200).json({ userType: null, message: '로그인되지 않았습니다.' });
        }

        const userId = sessionResult[0].user_id;

        // 로그인된 사용자의 결과 가져오기
        const userTypeQuery = 'SELECT user_type FROM usertype WHERE user_id = ?';
        const [userTypeResult] = await db.promise().query(userTypeQuery, [userId]);

        if (userTypeResult.length === 0) {
            // 저장된 결과가 없는 경우
            return res.status(200).json({ userType: null, message: '결과가 없습니다.' });
        }

        // 성공적으로 결과 반환
        res.status(200).json({ userType: userTypeResult[0].user_type });
    } catch (error) {
        console.error('API 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});



module.exports = router;
