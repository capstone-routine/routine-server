const express = require('express');
const router = express.Router();
const db = require('../db');

// 로그인 API
router.post('/Login', async (req, res) => {
    const { userID, userPW } = req.body;

    try {
        // 1. 세션 테이블 확인
        const checkSessionSql = 'SELECT * FROM session';
        db.query(checkSessionSql, (err, sessionResults) => {
            if (err) {
                console.error('세션 확인 쿼리 오류:', err);
                return res.status(500).json({ message: '로그인 상태 확인 중 오류 발생' });
            }

            if (sessionResults.length > 0) {
                // 세션이 존재하면 로그인을 차단
                return res.status(400).json({ message: '이미 다른 계정으로 로그인되어 있습니다.' });
            }

            // 2. 아이디와 비밀번호 확인
            const sql = 'SELECT * FROM Test WHERE ID = ? AND PW = ?';
            db.query(sql, [userID, userPW], (err, result) => {
                if (err) {
                    console.error('로그인 쿼리 오류:', err);
                    return res.status(500).json({ message: '로그인 오류' });
                }

                if (result.length > 0) {
                    // 세션 테이블에 데이터 삽입
                    const insertSessionSql = 'INSERT INTO session (user_id, user_name) VALUES (?, ?)';
                    db.query(insertSessionSql, [userID, result[0].User_name], (err) => {
                        if (err) {
                            console.error('세션 저장 오류:', err);
                            return res.status(500).json({ message: '세션 저장 오류' });
                        }

                        res.status(200).json({ message: '로그인 성공' });
                    });
                } else {
                    res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
                }
            });
        });
    } catch (err) {
        console.error('로그인 처리 중 오류:', err);
        res.status(500).json({ message: '로그인 처리 중 문제가 발생했습니다.' });
    }
});


module.exports = router;