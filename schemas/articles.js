// 모듈을 가져옴
const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
    articleId:{
        type:Number,
        required:true,
        unique:true,
    },
    name:{
        type:String,
        required:true,
        unique:true,
    },
    articlePw:{
        type:String,
        required:true,
    },
    date :{
        type:Date,
    },
    title:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
});

module.exports = mongoose.model("Article", articleSchema);