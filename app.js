// express 패키지 불러옴
const express = require("express");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
const authMiddleware = require('./middlewares/auth-middleware');
const Joi = require("joi");
const port = 8080;
const router = express.Router();

mongoose.connect("mongodb+srv://test:sparta@cluster0.rx7dw.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// mongoose.connect("mongodb://localhost:27017/spa_blog", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();

const requestMiddleware = (req, res, next) => {
    console.log("Request URL:", req.originalUrl, " - ", new Date());
    next();
};


app.use(express.json());
// JSON을 왜 추가해야하지???
// 터미널에서 콘솔값을 확인하기 위해서는 json을 찍어볼 필요가 있음.

app.use(requestMiddleware);
app.use("/api", express.urlencoded({ extended: false }), router);


app.get("/test", (req, res) => {
    res.send("테스트입니다");
});


// 게시물 목록 API
router.get("/articles", async (req, res) => {
    const articles = await Article.find().sort({ createdAt : 'desc' }).exec();
    console.log(articles);
    const authorIds = articles.map((author) => author.authorId);
    console.log(authorIds);
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



// 회원가입 API.
router.post('/users', async (req, res) => {
        console.log(req.body);
        const { authorName, password, confirmPassword } = req.body;
            // console.log(authorName, password, confirmPassword);

        if (password !== confirmPassword) {
           // 비밀번호, 비밀번호 확인 일치 여부 확인
            res.status(400).send({
                errorMessage:
                    '비밀번호와 비밀번호 확인의 내용이 일치하지 않습니다.',
            });
            return;
        }

        const existUsers = await User.find({ authorName });
        // console.log(authorName)
        if (existUsers.length) {
           // authorName 중복 데이터가 존재 할 경우
            res.status(400).send({
                errorMessage: '중복된 닉네임입니다.',
            });
            return;
        }

        const user = new User({ authorName, password });
        await user.save();

        res.status(201).send({});
    });



// 로그인 API
router.post("/login", async (req, res) => {
    const { authorName, password } = req.body;
    console.log(authorName, password);
    
    const user = await User.findOne({ authorName, password });

    if (!user) {
        res.status(400).send({ errorMessage: "이메일 또는 패스워드가 잘못 되었습니다." });
        return;
    }

    const token = jwt.sign({ authorName: user.authorName }, "yushin-secret-key");
    console.log(token);
    res.send({
        token,
    });
});


// 내 정보 조회 API, 로그인 시 사용
router.get('/users/me', authMiddleware, async (req, res) => {
    const { user } = res.locals;

    res.send({
        user: {
            authorId: user.authorId,
            authorName: user.authorName,
        },
    });
});



// 글쓰기 접근 시 사용자 정보를 가져가기 위한 메소드. write.ejs > getAuthorInfo()
router.get('/articles/write', authMiddleware, async (req, res) => {
    const { authorId } = res.locals.user;
    const authorInfo = await User.findById(authorId);
    res.status(200).send({
        author: {
            authorId: authorId,
            authorName: authorInfo.authorName,
        },
    });
});


// 게시물 쓰기 API
router.post('/articles/write', authMiddleware, async (req, res) => {
    const { authorId, articlePassword, title, content } = req.body;

    const postArticle = await Article.create({
        authorId,
        articlePassword,
        title,
        content,
    });
    // res.json({ article: postArticle });
    res.status(201).json({ result: 'success', msg: '글이 등록되었습니다.' });
});


// 게시물 상세 조회
app.get('/articles/:articleId', async (req, res) => {
    const { articleId } = req.params; // localhost:3000/api/articles/1, 2, ... <- 여기서 req.params는 { articleId : '1' }, articleId = 1
    console.log(articleId);
    const article = await Article.findById(articleId);
    const articleAuthor = await User.findById(article.authorId);
    const comments = await Comment.find({ articleId: articleId }).exec();

    const commentAuthorIds = comments.map(
        (commentAuthor) => commentAuthor.authorId
    );
    const commentAuthorInfoById = await User.find({
        _id: { $in: commentAuthorIds },
    })
        .exec()
        .then((commentAuthor) =>
            commentAuthor.reduce(
                (prev, ca) => ({
                    ...prev,
                    [ca.authorId]: ca,
                }),
                {}
            )
        );

    const articleInfo = {
        articleId: article._id,
        title: article.title,
        content: article.content,
        authorId: articleAuthor.authorId,
        authorName: articleAuthor.authorName,
        createdAt: article.createdAt,
    };

    const commentsInfo = comments.map((comment) => ({
        commentId: comment.commentId,
        content: comment.commentContent,
        authorInfo: commentAuthorInfoById[comment.authorId],
        createdAt: comment.createdAt,
    }));

    res.status(200).render('read', {
        article: articleInfo,
        commentsInfo: commentsInfo,
    });
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

app.get('/articles', async (req, res) => {
    res.status(200).render('index');
});

app.get('/articles/write', async (req, res) => {
    const article = ''; // write.ejs는 modify 부분과 같이 쓰므로,
    //새 글 쓰기 일 경우 !article 이 true 로 넘길 수 있도록 빈 스트링값 전달
    res.status(200).render('write', { article: article });
});

app.set('view engine', 'ejs'); // ejs 사용을 위해 view engine 에 ejs set
// app.use(express.static(__dirname + '/public'));


// port 뒤에 () <- 2번째 인자 값은 서버가 켜진 뒤 호출된다
app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!")
});