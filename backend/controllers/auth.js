const User = require('../models/user')
const shortId = require('shortid')
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');

exports.signup = (req, res) => {
    const { name, email, password } = req.body;

    User.findOne({email: email}).exec((err, user) => {
        if(user) {
            return res.status(400).json({
                error: 'Email is already taken'
            })
        }
    })
    
    let username = shortId.generate()
    let profile = `${process.env.CLIENT_URL}/${username}`

    let newUser = new User({
        name,
        email,
        password,
        profile,
        username
    })

    newUser.save((err, success) => {
        if(err) {
            return res.status(400).json({
                error: err
            })
        }
        return res.json({
            user: success,
            message: 'Signup success! please signin.'
        })
    })
}

exports.signin = (req, res) => {
    //check if user exist
    const { email, password } = req.body;

    User.findOne({email}).exec((err, user) => {
        if(err || !user) {
            return res.status(400).json({
               error: 'User with that email does not exist. Please signup.' 
            });
        }
        //authenticate
        if(!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email & password do not match.'
            })   
        }

        //generate a a token and send to client
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'})

        res.cookie('token', token, {expiresIn: '1d'})
        const { _id, username, name, email, role} = user;
        return res.json({
            token,
            user: { _id, username, name, email, role} 
        });
    })
    

}

exports.signout = (req, res) => {
    res.clearCookie("token");
    res.json({
        message: "Signout success"
    })
}

exports.requireLogin = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth", 
})