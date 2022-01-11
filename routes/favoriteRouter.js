const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
    .populate('user')
    .populate('campsites')
    .then(favorite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id}).then((favorites) => {
        if (favorites) {
            const newFavorites = req.body.filter((id) => !favorites.campsites.includes(id))
            newFavorites.forEach((id) => favorites.campsites.push(newFavorites))
            favorites.save()
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`Added campsites: ${newFavorites}`)
            })
        } else {
            const newFavorite = new Favorite({
                user: req.user._id,
                campsites: req.body
            });
            newFavorite.save().then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }).catch((e) => res.end(e));
        }
    });
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then((favorite) => {
        if (favorite) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.json(favorite)    
        } else {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/plain')
            res.end('You do not have any favorites to delete')
        }
    })
})

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id}).then((favorites) => {
        if (favorites) {
            if (favorites.campsites.includes(req.params.campsiteId)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain')
                res.end('That campsite is already in the list of favorites.')
            } else {
                favorites.campsites.push(req.params.campsiteId)
                favorites.save().then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites)    
                })
            }
        } else {
            const newFavorite = new Favorite({
                user: req.user._id,
                campsites: [req.params.campsiteId]
            });
            newFavorite.save().then((favorites) => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.json(favorites)
            }).catch((e) => res.end(e))
        }
    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id}).then((favorites) => {
        if (favorites) {
            if (favorites.campsites.includes(req.params.campsiteId)) {
                const newArray = favorites.campsites.filter(campsite => campsite != req.params.campsiteId)
                favorites.campsites = newArray
                favorites.save()
                res.statusCode = 200
                res.setHeader('Content-Type', 'text/plain')
                res.send(`Campsite ${req.params.campsiteId} deleted from favorites.`)
            } else {
                res.setHeader('Content-Type', 'text/plain')
                res.send('Campsite not found.')
            }
        } else {
            res.setHeader('Content-Type', 'text/plain')
            res.send('No favorites to delete.')
        }
    })
})

module.exports = favoriteRouter;