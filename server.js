// ******************************************************************************
// REQUIRE 
// ******************************************************************************
const express = require('express');
const app = express();

const cookieParser = require("cookie-parser");
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const dotenv = require('dotenv');
dotenv.config({path:"conf.env"});

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
// ******************************************************************************
// MIDDLEWARE
// ******************************************************************************
app.use(express.urlencoded({extended: true})); // POST Value transfer
app.use(express.static('assets')); // Static files support in directory of assets
app.set('view engine','ejs'); // Templete Engine
app.use(cookieParser());
app.use(session({secret : process.env.SECRET, resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

//MONGO DB Connection---------------------------------------------------------
const MongoClient = require('mongodb').MongoClient;
var data;
MongoClient.connect(`mongodb+srv://admin:${process.env.MONGODB}@cluster0.maab1cf.mongodb.net/?retryWrites=true&w=majority`,(err, client)=>{
    if(err) return console.log(err);
    data = client.db('e-learning');
})
// Image uploader
const storage = multer.diskStorage({
    destination: (req,res,cb)=>{
        cb(null, 'assets/user_photo/')
    },
    filename: (req,file,cb)=>{
        const ext = path.extname(file.originalname);
        cb(null,req.user._id+ext);
    }
})
const upload = multer({storage: storage});
// ******************************************************************************
// ROUTERS 
// ******************************************************************************
// MAIN (GET)
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
// USER ACCOUNT PAGE (GET?userID=$)
app.get('/account',verify_login,(req,res)=>{
    res.render('account.ejs',{user_render:req.user,userID:req.query.userID});
})

// Acount > upload User Photo
app.post('/change_pic',upload.single('file'),(req,res,next)=>{
    data.collection('users').updateOne({_id:req.user._id},{$set:{user_pic:1}},(err,result)=>{
        if(err) return{err}
    })
    res.render('account.ejs',{user_render:req.user,userID:req.query.userID})
})

// SIGN UP (GET)
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
            // Welcome Email Send
            const transporter = nodemailer.createTransport({
                service:'gmail',
                auth:{user:process.env.GMAIL_ID, pass:process.env.GMAIL_PWD},
                host:'smtp.gmail.com',
                port:'465'
            })
            const mailOption ={
                from:'Tremolo Account Management Team<noreply@tremolo.com>',
                to:req.body.email,
                subject:`Welcome to Tremolo! ${req.body.fname}`,
                html:`<h1>Thank you for signing up Tremolo</h1><p>Dear ${req.body.fname}</p><p>We are happy to offer our outstanding e-learning service!</p>`
            }
            transporter.sendMail(mailOption,(err, info)=>{
                if(err){console.log(err);} else {
                    console.log(info);
                } transporter.close();
            })
            // Message and Redirection to index.ejs
            // res.write('<script>alert("Signup process has been completed, Please login with your ID and password")</script>');
            res.write('<script>window.location="/"</script>')
        }
    })
})
// LOGIN/OUT & COURSE ********************************************************************
app.post('/login',passport.authenticate('local', {failureRedirect : '/'}),(req,res)=>{
    res.redirect('/course');
})
app.get('/logout',(req,res)=>{
    req.session.destroy(function(err){
        if(err) throw err;
    })
    res.render('main.ejs',{login:false});
})
// COURSE (GET) USER
app.get('/course',verify_login,(req,res)=>{
    res.render('course.ejs',{user_render:req.user})
})
    function verify_login(req,res,next){
        if(req.user){
            next()
        } else {
            // Try from non-login users
            res.write('<script>alert("You need to login in to see course contents!")</script>')
            res.write('<script>window.location="/"</script>')
        }
    }
passport.use(new LocalStrategy({
    usernameField: 'login_id',
    passwordField: 'login_pwd',
    session: true,
    passReqToCallback: false,
  }, function (inputID, inputPWD, done){
    data.collection('users').findOne({ id: inputID }, function(err, result){
        if (err) return done(err)
        if (!result) return done(null, false, { message: 'Id you typed in does not exsist' })
        const password = inputPWD;
        const encodedPasswords = result.pwd;
        const same = bcrypt.compareSync(password, encodedPasswords);
        if (same){
        return done(null, result);
      } else {
        return done(null, false, {message:'Incorect password!'});
      }
    })
  }));
// SESSION
passport.serializeUser((user, done)=>{
done(null, user.id)
});
passport.deserializeUser((id, done)=>{
data.collection('users').findOne({id:id},(err, result)=>{
    done(null, result)
})
});
// 404 Page Not Found
app.get('*',(req,res)=>{
    res.render('404.ejs',{
        title:'404',
        errorMSG:'Page not found'
    })
})

app.listen(8080,()=>{
    console.log('## Server working on 8080')
})

// Data ejection all from DB
// app.get('/list',(req,res)=>{
//     data.collection('db').find().toArray((error,result)=>{
//         res.render('list.ejs',{users:result});
//     }); 
// })

// MOCKUP
// https://www.figma.com/file/kFR8qJjMCPSoSJdsWxnlF2/Tremolo-UI-Elements?node-id=0%3A1&t=RxvO9mQBGKqd0HJQ-0

// WIN -> MAC
// % rm -rf node_modules/
// % npm update

// MAC->WIN
// > npm rebuild bcrypt --build-from-source
