var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');

router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON(), profile: user.toProfileJSONFor()});
  }).catch(next);
});

router.get('/friends', auth.required, function(req, res, next) {
  User.findById(req.payload.id)
  .populate('following', 'username image')
  .then(function(user){
    if(!user){ return res.sendStatus(401); }

    // Promise.all([
    //   User.count({ author: {$in: user.following}})
    // ]).then((results))

    return res.json({friends: user.followersToJson()});
  }).catch(next);
});

router.get('/followers', auth.required, function(req, res, next) {
  User.find({following: req.payload.id})
  .select('_id username image')
  .then(function(users){
    if(!users){ return res.sendStatus(401); }

    return res.json({
      followers: users
    });
  }).catch(next);
});

router.put('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    // only update fields that were actually passed...
    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.bio !== 'undefined'){
      user.bio = req.body.user.bio;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function(){
      return res.json({user: user.toAuthJSON(), profile: user.toProfileJSONFor()});
    });
  }).catch(next);
});

router.post('/users/login', function(req, res, next){
  if(!req.body.user.email){
    return res.status(422).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON(), profile: user.toProfileJSONFor()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post('/users', function(req, res, next){
  var user = new User();
  var rnd = Math.round(Math.random() * 3) + 1;

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);
  user.image = '/assets/images/circle-pet-'+rnd+'.png';

  user.save().then(function(){
    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

module.exports = router;
