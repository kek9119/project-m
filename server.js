const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // UUID 생성기

const app = express();
app.use(bodyParser.json());

// 메모리 저장 (테스트용)
const users = {};          // user_id -> { nickname, characterData, hasNickname, hasCharacter }
const socialLinks = {};     // 소셜ID -> user_id

// ✅ 1. 닉네임 저장 API
app.post('/save_nickname', (req, res) => {
    const { user_id, nickname } = req.body;

    if (!user_id || !nickname) {
        return res.status(400).json({ success: false, message: 'user_id와 nickname이 필요합니다.' });
    }

    if (!users[user_id]) users[user_id] = {};

    users[user_id].nickname = nickname;
    users[user_id].hasNickname = true;

    return res.json({ success: true, message: '닉네임 저장 완료' });
});

// ✅ 2. 캐릭터 저장 API
app.post('/create_character', (req, res) => {
    const { user_id, preset, customize_data } = req.body;

    if (!user_id || !preset || !customize_data) {
        return res.status(400).json({ success: false, message: '필수 정보 누락' });
    }

    if (!users[user_id]) users[user_id] = {};

    users[user_id].characterData = {
        preset,
        customizeData: customize_data
    };
    users[user_id].hasCharacter = true;

    return res.json({ success: true, message: '캐릭터 저장 완료' });
});

// ✅ 3. 게임 데이터 확인 API
app.post('/check_game_data', (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'user_id가 필요합니다.' });
    }

    const hasNickname = users[user_id]?.hasNickname || false;
    const hasCharacter = users[user_id]?.hasCharacter || false;

    return res.json({ has_nickname: hasNickname, has_character: hasCharacter });
});

// ✅ 4. 소셜 로그인 / 소셜 유저아이디 발급 API
app.post('/social_login', (req, res) => {
    const { google_id, apple_id, steam_id } = req.body;

    const socialId = google_id || apple_id || steam_id;
    if (!socialId) {
        return res.status(400).json({ success: false, message: '소셜 ID가 필요합니다.' });
    }

    // 이미 등록된 경우
    if (socialLinks[socialId]) {
        const existingUserId = socialLinks[socialId];
        return res.json({ success: true, user_id: existingUserId });
    }

    // 새로 생성
    const newUserId = uuidv4();
    socialLinks[socialId] = newUserId;
    users[newUserId] = {}; // 새 유저 기본 데이터 추가

    return res.json({ success: true, user_id: newUserId });
});

// ✅ 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버 실행중: 포트 ${PORT}`);
});
