const express = require('express');
const app = express();

const cookieParser = require("cookie-parser");
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const dotenv = require('dotenv');
dotenv.config({path:"conf.env"});

// MIDDLE WARE *******************************************************************
app.use(express.urlencoded({extended: true})); // POST Value transfer
app.use(express.static('assets')); // Static files support in directory of assets
app.set('view engine','ejs'); // Templete Engine
app.use(cookieParser());
app.use(session({secret : process.env.SECRET, resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.listen(8080,()=>{
    console.log('listening on 8080')
})
//MONGO DB Connection---------------------------------------------------------
const MongoClient = require('mongodb').MongoClient;
var data;
MongoClient.connect(`mongodb+srv://admin:${process.env.MONGODB}@cluster0.maab1cf.mongodb.net/?retryWrites=true&w=majority`,(err, client)=>{
    if(err) return console.log(err);
    data = client.db('e-learning');
})

// GET REQ (main.ejs)
app.get('/',(req,res)=>{
    res.render('main.ejs');
})
// GET REQ (signup.html)
app.get('/signup',(req,res)=>{
    res.render('signup.ejs');
})

// POST REQUEST
app.post('/add',(req,res)=>{
    res.send('sent!')
    data.collection('count').findOne({name:"userNum"},(err,result)=>{
        var users = result.total;
        data.collection('db').insertOne({_id: users+1, name:req.body.fname+' '+req.body.lname, email:req.body.email},(err,result)=>{
            //DB SAVE METHOD
            // Counter ++1
            data.collection('count').updateOne({name:"userNum"},{$inc:{total:1}},(err,result)=>{
                if(err){return err};//updateOne({target},{updated info},callback)
            }) 
        })
    });
})

// LOGIN ****************************************************************************
app.post('/login',passport.authenticate('local', {failureRedirect : '/'}),(req,res)=>{
    res.redirect('/course');
})
// show course for specific user
app.get('/course',verify_login,(req,res)=>{
    res.render('course.ejs',{user_render:req.user})
})
    function verify_login(req,res,next){
        if(req.user){
            next()
        } else {
            res.send('<script>alert("You need to login in to view this page")</script>');
        }
    }
passport.use(new LocalStrategy({
    usernameField: 'login_id',
    passwordField: 'login_pwd',
    session: true,
    passReqToCallback: false,
  }, function (inputID, inputPWD, done) {
    data.collection('users').findOne({ id: inputID }, function (err, result) {
      if (err) return done(err)
  
      if (!result) return done(null, false, { message: 'Id you typed in does not exsist' })

      if (inputPWD == result.pwd){
        return done(null, result)
      } else {
        return done(null, false, { message: 'Incorect password!' })
      }
    })
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (id, done) {
    data.collection('users').findOne({id:id},(err, result)=>{
        done(null, result)
    })
  }); 
// ****************************************************************************

// Data ejection from DB
// app.get('/list',(req,res)=>{
//     data.collection('db').find().toArray((error,result)=>{
//         res.render('list.ejs',{users:result});
//     }); 
// })