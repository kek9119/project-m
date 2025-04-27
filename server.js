const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 메모리 DB
const users = {};       // user_id or guest_id: { platform_type: platform_id }
const nicknames = {};   // user_id or guest_id: nickname
const characters = {};  // user_id or guest_id: character_data

// ✅ 로그인
app.post('/login', (req, res) => {
    const { login_type, platform_id } = req.body;

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
    const id = req.body.user_id || req.body.guest_id;

    if (!id) {
        return res.json({ success: false, message: "ID 없음" });
    }

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
    const id = req.body.user_id || req.body.guest_id;
    const { nickname } = req.body;

    if (!id || !nickname) {
        return res.json({ success: false, message: "ID 또는 닉네임 없음" });
    }

    for (const savedId in nicknames) {
        if (nicknames[savedId] === nickname) {
            if (savedId === id) {
                // 본인이면 OK
                return res.json({ success: true, message: "사용 가능한 닉네임" });
            } else {
                // 다른 사람이면 중복
                return res.json({ success: false, message: "닉네임 중복" });
            }
        }
    }

    return res.json({ success: true, message: "사용 가능한 닉네임" });
});

// ✅ 닉네임 저장
app.post('/save_nickname', (req, res) => {
    const id = req.body.user_id || req.body.guest_id;
    const { nickname } = req.body;

    if (!id || !nickname) {
        return res.json({ success: false, message: "ID 또는 닉네임 없음" });
    }

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
    const id = req.body.user_id || req.body.guest_id;
    const { character_data } = req.body;

    if (!id || !character_data) {
        return res.json({ success: false, message: "ID 또는 캐릭터 데이터 없음" });
    }

    characters[id] = character_data;

    const hasNickname = nicknames[id] ? true : false;

    return res.json({
        success: true,
        has_nickname: hasNickname,
        has_character: true
    });
});

// ✅ 플랫폼 연결 정보 조회
app.post('/get_linked_platforms', (req, res) => {
    const { user_id } = req.body;

    if (!users[user_id]) {
        return res.json({ success: false, message: "유저 없음" });
    }

    return res.json({
        success: true,
        platforms: users[user_id]
    });
});

// ✅ 게스트 연동 API (게스트 → 유저 전환)
app.post('/link_guest_account', (req, res) => {
    const { guest_id, platform_type, platform_id } = req.body;

    if (!users[guest_id]) {
        return res.json({ success: false, message: "게스트 ID 없음" });
    }

    const newUserId = "U_" + uuidv4();
    users[newUserId] = { [platform_type]: platform_id };

    if (nicknames[guest_id]) {
        nicknames[newUserId] = nicknames[guest_id];
    }
    if (characters[guest_id]) {
        characters[newUserId] = characters[guest_id];
    }

    // 게스트 데이터 삭제
    delete users[guest_id];
    delete nicknames[guest_id];
    delete characters[guest_id];

    return res.json({
        success: true,
        user_id: newUserId
    });
});

// ✅ 서버 실행
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ 서버 실행 중 (포트: ${port})`);
});
