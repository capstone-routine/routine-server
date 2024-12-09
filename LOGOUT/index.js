const express = require('express');
const router = express.Router();
const db = require('../db');

// 로그아웃 API
router.delete('/logout', (req, res) => {
    const checkSessionQuery = 'SELECT * FROM session';

    // 1. session 테이블 확인
    db.query(checkSessionQuery, (err, sessionResult) => {
        if (err) {
            console.error('session 테이블 확인 오류:', err);
            return res.status(500).json({ message: '서버 오류로 확인 실패' });
        }

        if (sessionResult.length === 0) {
            // 2. 세션에 데이터가 없을 경우
            return res.status(200).json({ message: '로그인 되어있지 않음' });
        }

        // 3. 로그아웃 처리
        const deleteSessionQuery = 'DELETE FROM session';
        db.query(deleteSessionQuery, (err, result) => {
            if (err) {
                console.error('session 테이블 삭제 오류:', err);
                return res.status(500).json({ message: '서버 오류로 로그아웃 실패' });
            }

            res.status(200).json({ message: '로그아웃 성공' });
        });
    });
});


module.exports = router;
