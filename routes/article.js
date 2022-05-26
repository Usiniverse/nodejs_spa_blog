const express = require("express");
const Article = require("../schemas/articles");
const router = express.Router();

// router라는 객체를 사용할 수 있게 됨



router.get("/", (req, res) => {
    res.send("this is root page");
})



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
    const { articleId } = req.params;

    const [detail] = await Article.find({ articleId: Number(articleId) });
    
    res.json({
        detail,
    });
});



// 게시물 삭제 API
router.delete("/article/:articleId/delete", async (req, res) => {
    const { articleId } = req.params;
    const { name, articlePw, date, title, content } = req.body;

    const deleteArticle = await Article.find({ articleId: Number(articleId) });
    if (articlePw === deleteArticle[0].articlePw) {
        await Article.deleteOne({ articleId:Number(articleId) });
    }
    console.log(deleteArticle[0].articlePw, articlePw);
    res.json({ success:true });
});



// 게시물 작성 API
router.post("/article", async (req, res) => {
    
    const { articleId, name, articlePw, title, content } = req.body;
    
    const article = await Article.find({ articleId });
    if (article.length) {
        return res
        .status(400).
        json({ success:false, errorMessage:"이미 있는 데이터입니다" })
    };

    const createdArticle = await Article.create({ articleId, name, articlePw, date:new Date(), title, content });
    
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

module.exports = router;
// 생성해서 정의한 Line2의 Router를 모듈로서 내보내겠다 
