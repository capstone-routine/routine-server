const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 코드 가져오기

// 사용자 추가 API
router.post('/addUser', (req, res) => {
    console.log('POST /api/addUser 호출됨:', req.body);
    const { userID, userPW, userName } = req.body;

    const sql = 'INSERT INTO Test (User_name, ID, PW) VALUES (?, ?, ?)';
    db.query(sql, [userName, userID, userPW], (err, result) => {
        if (err) {
            console.error('데이터베이스 오류:', err);
            return res.status(500).json({ message: '데이터베이스 오류' });
        }
        res.status(200).json({ message: '회원가입 성공!' });
    });
});

module.exports = router;
