const express = require('express');
const app = express();

const cookieParser = require("cookie-parser");
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const dotenv = require('dotenv');
dotenv.config({path:"conf.env"});

const bcrypt = require('bcrypt');

// MIDDLEWARE *******************************************************************
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
// ROUTERS ************************************************************************
// GET MAIN
app.get('/',verify_loginMain,(req,res)=>{
    if(req.user){
        res.render('main.ejs',{user_render:req.user, login:true});
    }
})
    function verify_loginMain(req,res,next){
        if(req.user){
            next()
        } else {
            res.render('main.ejs',{login:false});
        }
    }
// GET SIGN UP
app.get('/signup',(req,res)=>{
    res.render('signup.ejs');
})
// USER SIGNUP PROCESS
app.post('/register',(req,res)=>{
    let pwd_row = req.body.regis_pwd;
    let salt = 10;
    let hased;
    let hash = bcrypt.hashSync(pwd_row, salt, (err, hased)=>{
        console.log(hased);
    })

    data.collection('users').findOne({id:req.body.regis_id},(err,result)=>{
        if(result){
            res.write('<script>alert("The ID you typed in already exsisted. Try other ID")</script>')
            res.write('<script>window.location="/signup"</script>')
        } else {
            data.collection('count').findOne({name:"userNum"},(err,result)=>{
                var users = result.total;
                data.collection('users').insertOne({_id: users+1,id:req.body.regis_id, pwd:hash, name:req.body.fname+" "+req.body.lname, email:req.body.email, user_pic:0},(err,result)=>{
                    data.collection('count').updateOne({name:"userNum"},{$inc:{total:1}},(err,result)=>{
                        if(err){return err};
                    })
                })
            })
            console.log("completed!")
            res.redirect('/');
        }
    })
})

// LOGIN & COURSE ********************************************************************
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
            // Try from logout users
            res.write('<script>alert("You need to login in to see course contents!")</script>')
            res.write('<script>window.location="/"</script>')
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
        const password = inputPWD;
        const encodedPasswords = result.pwd;
        const same = bcrypt.compareSync(password, encodedPasswords);
        if (same){
        return done(null, result);
      } else {
        return done(null, false, { message: 'Incorect password!' });
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

//   const password = '1234';
//   const encryptedPassowrd = bcrypt.hashSync(password, 10);
//   console.log('en_psw :'+encryptedPassowrd);

//   const passworden = '1234'
//   const encodedPasswords = encryptedPassowrd
//   const same = bcrypt.compareSync(passworden, encodedPasswords)
//   console.log(same)
// ****************************************************************************

// Data ejection from DB
// app.get('/list',(req,res)=>{
//     data.collection('db').find().toArray((error,result)=>{
//         res.render('list.ejs',{users:result});
//     }); 
// })