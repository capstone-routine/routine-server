var mysql = require('mysql2');

// DB 연결 풀링을 사용하여 모듈화
const db = mysql.createPool({
    host : '34.22.106.220',  
    user : 'minsu',
    password : '1234',
    database : 'rutin'
});

module.exports = db;