const express = require('express');
const cors = require('cors');
const db = require('./db'); // 모듈화된 DB 연결 코드 가져오기

const app = express();
const port = 3000;


// CORS 설정
app.use(cors({
    origin: 'http://localhost:3001', // 클라이언트 도메인
    methods: ['GET', 'POST', 'DELETE', 'PUT'], // 허용할 메소드
    allowedHeaders: ['Content-Type'],
    credentials: true // 클라이언트 쿠키 허용
}));

app.use(express.json()); // JSON 형식의 요청 본문 파싱

app.use('/api', require('./LOGIN'));
app.use('/api', require('./LOGOUT'));
app.use('/api', require('./LOGINCHECK'));
app.use('/api', require('./SIGNUP'));
app.use('/api', require('./USERTYPE'));
app.use('/api', require('./MYPAGE'));
app.use('/api', require('./PURPOSE'));
app.use('/api', require('./ROUTINE'));
app.use('/api', require('./REVIEW'));

// 사용자 데이터를 가져오는 API
app.get('/api/users', (req, res) => {
    const sql = 'SELECT User_name, ID, PW FROM Test';  // DB에서 데이터를 가져오는 쿼리
    db.query(sql, (err, result) => {
        if (err) {
            console.error('쿼리 실행 중 오류 발생:', err);
            return res.status(500).send(err); // 에러 발생 시 500 에러 응답
        }
        res.json(result);  // 쿼리 결과를 JSON 형식으로 응답
    });
});

// 서버 실행
app.listen(port, '0.0.0.0', () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});