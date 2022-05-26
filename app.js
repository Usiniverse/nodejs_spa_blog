// express 패키지 불러옴
const express = require("express");
// 원래는 "./schemas/index.js"임. 그러나 자바스크립트에서 index.js는 생략할 수 있는 이름.
const connect = require("./schemas");
// 함수처럼 실행함. express에 서버 객체를 받아올 수 있음. 
const app = express();
const port = 3000;

connect();

const articleRouter = require("./routes/article");

const requestMiddleware = (req, res, next) => {
    console.log("Request URL:", req.originalUrl, " - ", new Date());
    next();
};

app.use(express.json());
//app.use는 미들웨어. 순서가 중요하다. 위에 있어야 아래의 코드들이 영향을 받음.
// next함수는 다음 미들웨어로 넘어갈 수 있게 해준다.
// next 함수를 쓰지 않을 경우 res()를 사용
app.use(requestMiddleware);

app.use("/api", [articleRouter]);

// get으로 HTTP 웹서버에서 요청을 받았는데 그 경로가 '/'
// req와 res라는 객체를 넣게끔 되어 있음. 이게 라우터(Router)
app.get("/", (req, res) => {
    res.send("Hello World");
});

// port 뒤에 () <- 2번째 인자 값은 서버가 켜진 뒤 호출된다
app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!")
});