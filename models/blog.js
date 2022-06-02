const mongoose = require('mongoose');

const BlogSchema = mongoose.Schema(
    {
        title: String,
        content: String,
        authorId: String,
        articlePassword: String,
    },
    { timestamps: true }
);

BlogSchema.virtual('articleId').get(function () {
    return this._id.toHexString();
});

BlogSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('Article', BlogSchema);

