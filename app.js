// express 패키지 불러옴
const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
const joi = require("joi");
const app = express();
const router = express.Router();
const port = 8080;


mongoose.connect("mongodb://127.0.0.1/spa_blog", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const requestMiddleware = (req, res, next) => {
    console.log("Request URL:", req.originalUrl, " - ", new Date());
    next();
};


app.use(express.json());
//app.use는 미들웨어. 순서가 중요하다. 위에 있어야 아래의 코드들이 영향을 받음.
// next함수는 다음 미들웨어로 넘어갈 수 있게 해준다.
// next 함수를 쓰지 않을 경우 res()를 사용
app.use(requestMiddleware);


// get으로 HTTP 웹서버에서 요청을 받았는데 그 경로가 '/'
// req와 res라는 객체를 넣게끔 되어 있음. 이게 라우터(Router)

// app.get("/", (req, res) => {
//     res.send("this is root page");
// })



// 게시물 목록 API
router.get("/articles", async (req, res) => {
    const articles = await Article.find().sort({ createdAt : 'desc' }).exec();
    const authorIds = articles.map((author) => author.authorId);
    const authorInfoById = await User.find({
        _id: { $in: authorIds },
    })
        .exec()
        .then((author) =>
            author.reduce(
                (prev, a) => ({
                    ...prev,
                    [a.authorId]: a,
                }),
                {}
            )
        );
        res.send({
            articles: articles.map((a) => ({
                articleId: a.articleId,
                title: a.title,
                content: a.content,
                createdAt: a.createdAt,
                authorInfo: authorInfoById[a.authorId],
            })),
        });
});



// 회원가입 API
router.post('/users', async (req, res) => {
        const { autherName, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            res.status(400).send({
                errorMessage:"패스워드가 패스워드 확인란이 다릅니다."
            });
            return;
        }

        const existsUsers = await user.findOne({ autherName });
        if (existsUsers) {
            res.status(400).send({
                errorMessage:"이메일 또는 닉네임이 사용중입니다."
            });
            return;
        }

        const user = new user({ autherName, password });
        await user.save();
        res.status(201).send({});
        }
    );


// 로그인 API
router.post("/login", async (req, res) => {
    const { userId, password } = req.body;

    const user = await Article.findOne({ userId, password });

    if (!user) {
        res.status(400).send({ errorMessage: "이메일 또는 패스워드가 잘못 되었습니다." });
        return;
    }

    const token = jwt.sign({ userId: user.userId }, "yushin-secret-key");
    res.send({
        token,
    });
});



// 게시물 목록 API
router.get("/article", async (req, res) => {
    const article = await Article.find();

    res.json({
        article,
    });
});



// 게시물 상세 조회 API
// :articleId => : 뒤에는 아무 값이나 받겠다. '이 값을 articleId로 받겠다'라고 지정한 것임.
router.get("/article/:articleId", async (req, res) => {
    const { userId } = req.params;

    const [detail] = await Article.find({ userId });
    
    res.json({
        detail,
    });
});



// 게시물 삭제 API
router.delete("/article/:articleId/delete", async (req, res) => {
    const { userId } = req.params;
    const { password } = req.body;

    const deleteArticle = await Article.find({ userId });
    if (password === deleteArticle[0].password) {
        await Article.deleteOne({ userId });
    }
    console.log(deleteArticle[0]);
    res.json({ success:true });
});



// 게시물 작성 API
router.post("/article", async (req, res) => {
    
    const { userId, title, content } = req.body;
    
    const article = await Article.find({ userId });
    if (article.length) {
        return res
        .status(400)
        .json({ success:false, errorMessage:"이미 있는 데이터입니다" })
    };

    const createdArticle = await Article.create({ userId, date:new Date(), title, content });
    
    res.json({ article:createdArticle });
});



// 게시글 수정 API
router.put("/article/:articleId/update", async (req, res) => {
    const { articleId } = req.params;
    const { name, articlePw, date, title, content } = req.body;

    const updateArticle = await Article.find({ articleId:Number(articleId) });
    if (!updateArticle.length) {
        return res
        .status(400)
        .json({ success:false, errorMessage:"게시글이 없습니다."})
    };

    console.log(updateArticle.articlePw, updateArticle);
    if (articlePw === updateArticle[0].articlePw) {
        await Article.updateOne({ articleId: Number(articleId) }, { $set: {content, date, title} });
    };

    res.json({ success: true });
});

app.get('/', async (req, res) => {
    res.status(200).render('index');
});

app.get('/users', async (req, res) => {
    res.status(200).render('users');
});

app.get('/signup', async (req, res) => {
    res.status(200).render('signup');
});

app.get('/login', async (req, res) => {
    res.status(200).render('login');
});

app.get('/articles/write', async (req, res) => {
    const article = ''; // write.ejs는 modify 부분과 같이 쓰므로,
    //새 글 쓰기 일 경우 !article 이 true 로 넘길 수 있도록 빈 스트링값 전달
    res.status(200).render('write', { article: article });
});

app.set('view engine', 'ejs'); // ejs 사용을 위해 view engine 에 ejs set
app.use(express.static(__dirname + '/public'));

// port 뒤에 () <- 2번째 인자 값은 서버가 켜진 뒤 호출된다
app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!")
});