// express 패키지 불러옴
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
const jwt = require("jsonwebtoken");
const requestMiddleware = require('./middlewares/request-middlewares');
const authMiddleware = require("./middlewares/auth-middleware");
const dotenv = require("dotenv");
dotenv.config();
const port = 8080;


// *** DB
mongoose.connect("mongodb+srv://test:sparta@cluster0.rx7dw.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));


// *** 서버 어플리케이션
const app = express();

// *** 라우터 사용
const router = express.Router();

// *** Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }), router);

// *** 미들웨어
app.use(requestMiddleware);

// ======================================================================
// ======================================================================


// *** index
app.get("/", (req, res) => {
    res.send("this is root page");
});


// *** 게시물 상세 조회 API
app.get('/articles/:articleId', async (req, res) => {
    const { articleId } = req.params; // localhost:3000/api/articles/1, 2, ... <- 여기서 req.params는 { articleId : '1' }, articleId = 1
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
    console.log(articleInfo);

    const commentsInfo = comments.map((comment) => ({
        commentId: comment.commentId,
        content: comment.commentContent,
        authorInfo: commentAuthorInfoById[comment.authorId],
        createdAt: comment.createdAt,
    }));

    res.status(200).json({
        article: articleInfo,
        commentsInfo: commentsInfo,
    }); 
});


// *** 게시물 작성 API
router.post('/articles/write', authMiddleware, async (req, res) => {
    const { authorId, articlePassword, title, content } = req.body;
    // console.log(req.body);

    // const postArticle = await Articles.create({ articleId, title, content, authorId, authorName, articlePassword });
    const postArticle = await Article.create({
        authorId,
        articlePassword,
        title,
        content,
    });
    // res.json({ article: postArticle });
    res.status(201).json({ result: 'success', msg: '글이 등록되었습니다.' });
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


// *** 게시물 수정 API
app.get('/articles/:articleId/modify', async (req, res) => {
    const { articleId } = req.params;

    const article = await Article.findById(articleId);
    res.status(200).send({ article: article });
});

router.patch('/articles/:articleId/modify',authMiddleware, async (req, res) => {
        const { title, content, authorId, articlePassword, articleId } = req.body;
        const article = await Article.findById(articleId);
        if (article.articlePassword !== articlePassword) {
            res.status(400).json({
                result: 'error',
                msg: '비밀번호가 일치하지 않습니다!',
            });
        } else {
            const modifyArticle = await Article.findByIdAndUpdate(articleId, {
                $set: { title: title, content: content },
            });
            res.status(201).json({
                result: 'success',
                msg: '글이 수정되었습니다.',
            });
        }
    }
);


// *** 게시글 삭제 API
router.delete('/articles/:articleId/delete', async (req, res) => {
        const { articlePassword, articleId } = req.body;
        const existsArticle = await Article.findById(articleId);

        if (existsArticle) {
            // existsArticle 이 존재하는 경우 = 쿼리 결과가 있는 경우
            if (existsArticle.articlePassword !== articlePassword) {
                // 글 지우기 전 입력받은 비밀번호 체크
                res.status(400).json({
                    result: 'error',
                    msg: '비밀번호가 일치하지 않네요.',
                }); // 이거 대체 뭘로 줌? response? error? xhr?
            } else {
                await Article.findByIdAndDelete(articleId); // articleId 일치하는 것으로 삭제
                res.status(200).json({
                    result: 'success',
                    msg: '글이 삭제되었습니다.',
                });
            }
        } else {
            // 올 일은 없지만, id값으로 찾아진게 없다는 것은 멀티 세션으로 같은 글을 동시에 지우려고 했을때?
            res.status(400).json({
                result: 'error',
                msg: '게시글이 이미 삭제되었습니다.',
            });
        }
    }
);


// *** 댓글 작성 API
router.post('/comments/write', authMiddleware, async (req, res) => {
    const { authorId, articleId, commentContent } = req.body;
    // console.log(req.body);

    const postArticle = await Comment.create({
        authorId,
        articleId,
        commentContent,
    });
    // res.json({ article: postArticle });
    res.status(201).json({ result: 'success', msg: '댓글이 등록되었습니다.' });
});


// *** 댓글 수정 API
router.patch('/comments/:commentId/modify', authMiddleware, async (req, res) => {
        const { commentId, articleId, modifiedCommentContent } = req.body;
        const comment = await Comment.findById(commentId);
        if (comment) {
            const modifiedComment = await Comment.findByIdAndUpdate(commentId, {
                $set: { commentContent: modifiedCommentContent },
            });
            res.status(201).json({
                result: 'success',
                msg: '댓글이 수정되었습니다.',
            });
        } else {
            res.status(400).json({
                result: 'error',
                msg: '댓글 수정에 실패했습니다..',
            });
        }
    }
);


// *** 댓글 삭제 API
router.delete('/comments/:commentId/delete', authMiddleware, async (req, res) => {
        const { commentId } = req.body;
        const existsComment = await Comment.findById(commentId);
        console.log(commentId);
        if (existsComment) {
            await Comment.findByIdAndDelete(commentId); // commentId 일치하는 것으로 삭제
            res.status(200).json({
                result: 'success',
                msg: '코멘트가 삭제되었습니다.',
            });
        } else {
            // 올 일은 없지만, id값으로 찾아진게 없다는 것은 멀티 세션으로 같은 글을 동시에 지우려고 했을때?
            res.status(400).json({
                result: 'error',
                msg: '해당 코멘트는 이미 삭제되었습니다.',
            });
        }
    }
);

// *** 회원가입 API.
router.post('/signup', async (req, res) => {
    const { authorName, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        res.status(400).send({ errorMessage: '비밀번호와 비밀번호 확인의 내용이 일치하지 않습니다.', });
        return;
    }

    const existUsers = await User.find({ authorName })
    if (existUsers.length) {
        return res.status(400).send({ errorMessage: '중복된 닉네임입니다.', });
    }

    const user = new User({ authorName, password })
    await user.save();

    res.status(201).send({ message:"회원 가입에 성공했습니다!" });
});


// *** 로그인 API
router.post('/login', async (req, res) => {
    const { authorName, password } = req.body;

        const user = await User.findOne({ authorName, password }).exec();
        if (!user) {
            res.status(400).send({
                errorMessage: '닉네임 또는 패스워드를 확인해주세요.',
            });
            return;
        }

        // const id = user.authorId;
        const token = jwt.sign({ authorId: user.authorId }, process.env.SECRET_KEY); 
        res.status(200).send({ message: "로그인에 성공했습니다", token });
        console.log(token);
    });


// *** 내 정보 조회 API
router.get('/users/me', authMiddleware, async (req, res) => {
    const { user } = res.locals;
    res.send({
        user: {
            authorId: user.authorId,
            authorName: user.authorName,
        },
    });
});


// *** 포트 번호
app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!")
});