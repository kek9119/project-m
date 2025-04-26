const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// 기본 셋팅
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 메모리 임시 저장소 (진짜 배포 때는 DB 써야 함)
const users = {};        // user_id => { 구글/애플/스팀 ID들 }
const nicknames = {};    // user_id => nickname
const characters = {};   // user_id => character data

// ✅ 로그인 처리
app.post('/login', (req, res) => {
    const { platform_id, platform_type } = req.body; // platform_type: google, apple, steam

    // platform_id가 이미 users에 연결되어 있는지 검사
    let existingUserId = null;
    for (const userId in users) {
        if (users[userId][platform_type] === platform_id) {
            existingUserId = userId;
            break;
        }
    }

    // 이미 연결된 유저
    if (existingUserId) {
        return res.json({ success: true, user_id: existingUserId });
    }

    // 없으면 새 유저 발급
    const newUserId = uuidv4();
    users[newUserId] = { [platform_type]: platform_id };
    return res.json({ success: true, user_id: newUserId });
});

// ✅ 플랫폼 추가 연동
app.post('/link_platform', (req, res) => {
    const { user_id, platform_id, platform_type } = req.body;

    // 이미 다른 user_id에 연결된 platform_id가 있는지 검사
    for (const otherUserId in users) {
        if (users[otherUserId][platform_type] === platform_id && otherUserId !== user_id) {
            return res.json({
                success: false,
                message: "해당 플랫폼 계정은 이미 다른 유저 아이디에 연결되어 있습니다. 기존 계정으로 로그인 해주세요."
            });
        }
    }

    // 문제 없으면 현재 user_id에 플랫폼 연동
    if (!users[user_id]) users[user_id] = {};
    users[user_id][platform_type] = platform_id;
    return res.json({ success: true, message: "플랫폼 연동 완료" });
});

// ✅ 닉네임 저장
app.post('/save_nickname', (req, res) => {
    const { user_id, nickname } = req.body;
    nicknames[user_id] = nickname;

    return res.json({
        success: true,
        has_nickname: true,
        has_character: characters[user_id] ? true : false
    });
});

// ✅ 캐릭터 저장
app.post('/create_character', (req, res) => {
    const { user_id, character_data } = req.body;
    characters[user_id] = character_data;

    return res.json({
        success: true,
        has_nickname: nicknames[user_id] ? true : false,
        has_character: true
    });
});

// ✅ 서버 포트 열기
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ 서버가 포트 ${port}에서 실행 중`);
});
