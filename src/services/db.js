import DB from '../db'

const db = new DB()
const connect = db.init()
const article = connect.article
const feed = connect.feed

export default {
    ensureIndex(db, field) {
        db.ensureIndex({
            fieldName: field,
            unique: true
        })
    },
    fetchFeeds(cb) {
        return feed.find({}, (docs) => {
            return cb(docs)
        })
    },
    fetchArticles(cb) {
        return article.find({}).sort({
            pubDate: -1
        }).exec((docs) => {
            cb(docs)
        })
    },
    fetchArticle(id, cb) {
        return article.findOne({
            _id: id
        }, (doc) => {
            return cb(doc)
        })
    },
    addFeed(data, cb) {
        this.ensureIndex(feed, 'xmlurl')
        return feed.insert(data, (docs) => {
            return cb(docs)
        })
    },
    deleteFeed(id) {
        feed.remove({
            id: id
        }, {})
    },
    addArticles(data, cb) {
        this.ensureIndex(article, 'guid')
        return article.insert(data, (docs) => {
            return cb(docs)
        })
    },
    deleteArticles(id) {
        article.remove({
            feed_id: id
        }, {
            multi: true
        })
    },
    markOffline(id) {
        article.update({
            _id: id
        }, {
            $set: {
                offline: true
            }
        })
    },
    markOnline(id) {
        article.update({
            _id: id
        }, {
            $set: {
                offline: false
            }
        })
    },
    markFavourite(id) {
        article.update({
            _id: id
        }, {
            $set: {
                favourite: true
            }
        })
    },
    markUnfavourite(id) {
        article.update({
            _id: id
        }, {
            $set: {
                favourite: false
            }
        })
    },
    markRead(id) {
        article.update({
            _id: id
        }, {
            $set: {
                read: true
            }
        })
    },
    markUnread(id) {
        article.update({
            _id: id
        }, {
            $set: {
                read: false
            }
        })
    }
}