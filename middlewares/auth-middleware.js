const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require("dotenv");
dotenv.config();

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' '); // 공백을 기준으로 잘라 배열로 반환.

    // tokenType 값이 'Bearer' 가 아닌 경우 토큰값이 없다고 판별하고 튕겨냄.
    // .. 라고 생각했는데, localStorage를 비우고 난 후에 주소로 접근하면 "Bearer null" 로 들어옴.

    if (tokenType !== 'Bearer') {
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
    try {
        const { authorId } = jwt.verify(tokenValue, process.env.SECRET_KEY); // 유효한 토큰인지 확인. verify
        
        User.findOne({"_id": authorId }).exec().then((user) => {
            res.locals.user = user;
            next()
        });
        
    } catch (error) {
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
};