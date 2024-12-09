const express = require('express');
const router = express.Router();
const db = require('../db');

// 세션 체크 API
router.get('/LoginCheck', (req, res) => {
    const sql = 'SELECT * FROM session';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('세션 확인 오류:', err);
            return res.status(500).json({ message: '서버 오류로 인해 세션 확인에 실패했습니다.' });
        }

        if (results.length > 0) {
            return res.status(200).json({ message: '이미 로그인 상태입니다.' });
        }

        res.status(200).json({ message: '로그인 가능' });
    });
});

module.exports = router;
