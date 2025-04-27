const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 메모리 DB (배포시 진짜 DB로 바꿔야 함)
const users = {};       // user_id: { platform_type: platform_id, ... }
const nicknames = {};   // user_id: nickname
const characters = {};  // user_id: character_data

// ✅ 로그인
app.post('/login', (req, res) => {
    const { login_type, platform_id } = req.body;

    // 1. platform_id로 기존 user 찾기
    let foundUserId = null;
    for (const userId in users) {
        if (users[userId][login_type] === platform_id) {
            foundUserId = userId;
            break;
        }
    }

    if (foundUserId) {
        return res.json({ success: true, user_id: foundUserId });
    }

    // 2. 없으면 새로 user_id 발급
    const newUserId = "U_" + uuidv4();
    users[newUserId] = { [login_type]: platform_id };
    return res.json({ success: true, user_id: newUserId });
});

// ✅ 게스트 등록
app.post('/register_guest', (req, res) => {
    const { guest_id } = req.body;

    if (!guest_id.startsWith("G_")) {
        return res.json({ success: false, message: "Invalid guest ID format." });
    }

    if (!users[guest_id]) {
        users[guest_id] = { guest: guest_id };
    }

    return res.json({ success: true });
});

// ✅ 게임 데이터 조회
app.post('/check_game_data', (req, res) => {
    const { id } = req.body;

    const hasNickname = nicknames[id] ? true : false;
    const hasCharacter = characters[id] ? true : false;

    return res.json({
        success: true,
        has_nickname: hasNickname,
        has_character: hasCharacter
    });
});

// ✅ 닉네임 중복 검사
app.post('/check_nickname', (req, res) => {
    const { nickname } = req.body;

    const isDuplicate = Object.values(nicknames).includes(nickname);

    if (isDuplicate) {
        return res.json({ success: false, message: "닉네임 중복" });
    }

    return res.json({ success: true, message: "사용 가능한 닉네임" });
});

// ✅ 닉네임 저장
app.post('/save_nickname', (req, res) => {
    const { id, nickname } = req.body;

    nicknames[id] = nickname;

    const hasCharacter = characters[id] ? true : false;

    return res.json({
        success: true,
        has_nickname: true,
        has_character: hasCharacter
    });
});

// ✅ 캐릭터 저장
app.post('/create_character', (req, res) => {
    const { id, character_data } = req.body;

    characters[id] = character_data;

    const hasNickname = nicknames[id] ? true : false;

    return res.json({
        success: true,
        has_nickname: hasNickname,
        has_character: true
    });
});

// ✅ 현재 연결된 플랫폼 정보 요청
app.post('/get_linked_platforms', (req, res) => {
    const { user_id } = req.body;

    if (!users[user_id]) {
        return res.json({ success: false, message: "유저 없음" });
    }

    return res.json({
        success: true,
        platforms: users[user_id]  // ex) { google: "xxxx", steam: "yyyy", apple: "zzzz" }
    });
});

// ✅ 서버 실행
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ 서버 실행 중 (포트: ${port})`);
});
