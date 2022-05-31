const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
    {
        authorName: String,
        password: String,
    },
    { timestamps: true }
);
UserSchema.virtual('authorId').get(function () {
    return this._id.toHexString();
});
UserSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model('User', UserSchema);