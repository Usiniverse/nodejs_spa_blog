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

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();

const requestMiddleware = (req, res, next) => {
    console.log("Request URL:", req.originalUrl, " - ", new Date());
    next();
};


app.use(express.json());

//app.use는 미들웨어. 순서가 중요하다. 위에 있어야 아래의 코드들이 영향을 받음.
// next함수는 다음 미들웨어로 넘어갈 수 있게 해준다.
// next 함수를 쓰지 않을 경우 res()를 사용
app.use(requestMiddleware);
// app.use("/api", express.urlencoded({ extended: false }), router);
app.use(router);

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



// * 회원가입 API.
// * 특정 pattern을 미리 정규표현식으로 정의하여, 변수로 선언해둔다.
// * postUserSchema 는 authorName, password, confirmPassword에 대해 Joi 라이브러리를 통해 조건을 명시함.
// */
router.post('/signup', async (req, res) => {
       // const { nickname, email, password, confirmPassword } = req.body;
        const { authorName, password, confirmPassword } = req.body;
            console.log(authorName, password, confirmPassword);

        if (password !== confirmPassword) {
           // 비밀번호, 비밀번호 확인 일치 여부 확인
            res.status(400).send({
                errorMessage:
                    '비밀번호와 비밀번호 확인의 내용이 일치하지 않습니다.',
            });
           return; // 이 코드 이하의 코드를 실행하지 않고 탈출
        }

        const existUsers = await User.find({ authorName });
        // console.log(authorName)
        if (existUsers) {
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





// // 회원가입 API
// router.post('/signup', async (req, res) => {
//         // console.log(req.body);
//         const { authorName, password, confirmPassword } = req.body;
//         // console.log(authorName, password, confirmPassword);

//         if (password !== confirmPassword) {
//             res.status(400).send({
//                 errorMessage:"패스워드가 패스워드 확인란이 다릅니다."
//             });
//             return;
//         }

//         const existsUsers = await User.findOne({ authorName });
//         if (existsUsers) {
//             res.status(400).send({
//                 errorMessage:"이메일 또는 닉네임이 사용중입니다."
//             });
//             return;
//         }

//         const user = new User({ authorName, password });
//         await user.save();
//         res.status(201).send({});
//         }
//     );



    // // * 로그인 API.
    // router.post('/login', async (req, res) => {
    //     try {
    //        // const { email, password } = req.body;
    //         const { authorName, password } = req.body;
    //         console.log(authorName, password);
    
    //         const user = await User.findOne({ authorName, password });
    //         if (!user) {
    //             res.status(400).send({
    //                 errorMessage: '닉네임 또는 패스워드를 확인해주세요.',
    //             });
    //             return;
    //         } 
    //         console.log(user.authorId);
    //         console.log(user.authorName);
    //         console.log(user.password);
    //        // const token = jwt.sign({ userId: user.userId }, "MY-SECRET-KEY"); // 토큰을 서버쪽에서 sign 하여 생성
    //         const token = jwt.sign({ authorName: user.authorName }, "yushin-secret-key"); // 토큰을 서버쪽에서 sign 하여 생성
    //         console.log(token);
    //        // console.log(typeof(token));
    //         res.send({
    //            token, // 전달
    //         });
    //         console.log(res.send);
    //     } catch (err) {
    //        // console.log(err);
    //         res.status(400).send({
    //             errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    //         });
    //     }
    // });



// 로그인 API
router.post("/login", async (req, res) => {
    // console.log(req.body);
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
    // console.log(req.body);
    console.log(res.locals);
    // console.log(typeof(res.locals));
    /**
     * res.locals 내용 예시
     * [Object: null prototpye] { user: { _id: new ObjectId("61f..78"), authorName: 'shjin', password: 'mypassword', createdAt: 2022-02-01T10:28:53.882Z, ...  __v: 0 }}
     */
    const { user } = res.locals; // user object
    // console.log(res.locals);
    // console.log(user);
    res.send({
        user: {
            authorId: user.authorId,
            authorName: user.authorName,
        },
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
router.post("/articles/write", async (req, res) => {
    
    const { authorId, title, content, articlePassword } = req.body;

    const createdArticle = await Article.create({ 
        authorId, 
        title, 
        content, 
        articlePassword });
    
    res.status(201).json({ result: 'success', msg: '글이 등록되었습니다.' });
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