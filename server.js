// ******************************************************************************
// REQUIRE
// ******************************************************************************
const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const dotenv = require("dotenv");
dotenv.config({ path: "conf.env" });

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
// ******************************************************************************
// MIDDLEWARE
// ******************************************************************************
app.use(express.urlencoded({ extended: true })); // POST Value transfer
app.use(express.static("public")); // Static files support in directory of assets
app.set("view engine", "ejs"); // Templete Engine
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//MONGO DB Connection---------------------------------------------------------
const MongoClient = require("mongodb").MongoClient;
var data;
MongoClient.connect(
  `mongodb+srv://admin:${process.env.MONGODB}@cluster0.maab1cf.mongodb.net/?retryWrites=true&w=majority`,
  (err, client) => {
    if (err) return console.log(err);
    data = client.db("e-learning");
  }
);
// Image uploader
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/user_photo/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + ext);
  },
});
const upload = multer({ storage: storage });
// ******************************************************************************
// ROUTERS
// ******************************************************************************
// MAIN (GET)
app.get("/", verify_loginMain, (req, res) => {
  if (req.user) {
    res.render("main.ejs", { user_render: req.user, login: true, tt:true });
  }
});
function verify_loginMain(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("main.ejs", { login: false, tt:true });
  }
}
// USER ACCOUNT PAGE (GET?userID=$)
app.get("/account", verify_login, (req, res) => {
  res.render("account.ejs", {
    user_render: req.user,
    userID: req.query.userID,
  });
});

// Acount > upload User Photo
app.post("/change_pic", upload.single("file"), (req, res, next) => {
  data
    .collection("users")
    .updateOne(
      { _id: req.user._id },
      { $set: { user_pic: 1 } },
      (err, result) => {
        if (err) return { err };
      }
    );
  // res.render("account.ejs", {
  //   user_render: req.user,
  //   userID: req.query.userID,
  // });
  res.redirect(`/account?userID=${req.user._id}`);
});

// SIGN UP (GET)
app.get("/signup", (req, res) => {
  res.render("signup.ejs",{sameID:false});
});
// USER SIGNUP PROCESS
app.post("/register", (req, res) => {
  let pwd_row = req.body.regis_pwd;
  let salt = 10;
  let hased;
  let hash = bcrypt.hashSync(pwd_row, salt, (err, hased) => {
    console.log(hased);
  });

  data.collection("users").findOne({ id: req.body.regis_id }, (err, result) => {
    if (result) {
      // res.write('<script>alert("The ID you typed in already exsisted. Try other ID");window.location="/signup";</script>');
      // res.write('<script>window.location="/signup"</script>');
      res.render("signup.ejs",{sameID:true})
    } else {
      data.collection("count").findOne({ name: "userNum" }, (err, result) => {
        var users = result.total;
        data
          .collection("users")
          .insertOne(
            {
              _id: users + 1,
              id: req.body.regis_id,
              pwd: hash,
              name: { fname:req.body.fname,
                      lname:req.body.lname
                    },
              email: req.body.email,
              user_pic: 0,
              plan:0, // replace 0 with req.body.(name)
              course:{ currentM:1,
                       currentSubM:1,
                       progress:0,
                       testResult:{
                        m1:0,
                        m2:0,
                        m3:0,
                        m4:0
                       }
                      }
            },
            (err, result) => {
              data
                .collection("count")
                .updateOne(
                  { name: "userNum" },
                  { $inc: { total: 1 } },
                  (err, result) => {
                    if (err) {
                      return err;
                    }
                  }
                );
            }
          );
      });
      // Welcome Email Send
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_ID, pass: process.env.GMAIL_PWD },
        host: "smtp.gmail.com",
        port: "465",
      });
      const mailOption = {
        from: "Tremolo Account Management Team<noreply@tremolo.com>",
        to: req.body.email,
        subject: `Welcome to Tremolo! ${req.body.fname}`,
        html: `<h1>Thank you for signing up Tremolo</h1><p>Dear ${req.body.fname}</p><p>We are happy to offer you our outstanding e-learning service!</p>`,
      };
      transporter.sendMail(mailOption, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
        transporter.close();
      });
      // Message and Redirection to main.ejs
      res.render("main.ejs", { user_render: req.user, login: false })
    }
  });
});
// LOGIN/OUT & COURSE ********************************************************************
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(`/course/m${req.user.course.currentM}-${req.user.course.currentSubM}`);
  }
);
app.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) throw err;
  });
  // res.render("main.ejs", { login: false });
  res.redirect("/");
});
// COURSE (GET) USER
app.get("/course/:moduleID", verify_login, (req, res) => {
  res.render(`./modules/${req.params.moduleID}`, { user_render: req.user,videoURL:'http://dev.saitnewmedia.ca/~spark/tremolo/' });
});
app.get("/course", verify_login, (req, res) => {
  res.render(`course.ejs`, { user_render: req.user });
});

function verify_login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("main.ejs", { user_render: req.user, login: false, tt:false })
  }
}
passport.use(
  new LocalStrategy(
    {
      usernameField: "login_id",
      passwordField: "login_pwd",
      session: true,
      passReqToCallback: false,
    },
    function (inputID, inputPWD, done) {
      data.collection("users").findOne({ id: inputID }, function (err, result) {
        if (err) return done(err);
        if (!result)
          return done(null, false, {
            message: "ID you typed in does not exsist",
          });
        const password = inputPWD;
        const encodedPasswords = result.pwd;
        const same = bcrypt.compareSync(password, encodedPasswords);
        if (same) {
          return done(null, result);
        } else {
          return done(null, false, { message: "Incorect password!" });
        }
      });
    }
  )
);
// SESSION
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  data.collection("users").findOne({ id: id }, (err, result) => {
    done(null, result);
  });
});

// PARSE JSON *************************
app.get("/list", (req, res) => {
  data
    .collection("users")
    .find()
    .toArray((error, result) => {
      res.send(result);
    });
});
// ***************************************************************************
// ASSESSEMENT TEST PROCESSING
app.post('/recordAssess',(req, res)=>{
  data
  .collection("users")
  .updateOne(
    { id: req.body.user_id },
    { $set: {"course.currentM":req.body.moduleNext, "course.currentSubM":1}},
    (err, result) => {
      if (err) return { err };
    }
  )
  // res.render(`./modules/m${req.body.moduleNext}-1`,{ user_render: req.user });
  res.redirect(`course/m${req.body.moduleNext}-1`);
})
// Checkout each module
app.post('/progressCheck',(req,res)=>{
  data // Current Module Update
  .collection("users")
  .updateOne(
    { id: req.body.user_id},
    { $set: {"course.currentM":req.body.moduleNum,"course.currentSubM":req.body.subModuleNum}},
    (err, result) => {
      if (err) return { err };
    }
    );
    // ADD Progress Percentage
    let progress= parseInt(req.body.percentProgress)
    data
    .collection("users")
    .updateOne(
        { id: req.body.user_id },
        { $inc: { "course.progress": progress}},
        (err, result) => {
            if (err) return { err };
          }
        );
  // res.render(`./modules/m${req.body.moduleNum}-${req.body.subModuleNum}`,{ user_render: req.user });
  res.redirect(`course/m${req.body.moduleNum}-${req.body.subModuleNum}`);
})

// 404 NOT FOUND
app.use(function(req, res, next) {
  res.status(404).render("404.ejs", {
        title: "404",
        errorMSG: "Page not found",
      });
});
app.listen(8080, () => {
  console.log("## Server working on 8080");
});

// MOCKUP
// https://www.figma.com/file/kFR8qJjMCPSoSJdsWxnlF2/Tremolo-UI-Elements?node-id=0%3A1&t=RxvO9mQBGKqd0HJQ-0

// GOOGLE CLOUD SERVER
// https://tremolo-370108.wl.r.appspot.com/

// Shift + Alt +F -> Formatter

// WIN -> MAC
// % rm -rf node_modules/
// % npm update

// MAC->WIN
// > npm rebuild bcrypt --build-from-source

// Updated on 11-29 : AM 02:08

// GIT COMMANDS
// git pull origin main
// git commit -m 'messages'
// git push origin your branch

// Google Cloud Re-Deploy
// gcloud init
// gcloud app deploy

// TODO LIST

// FINAL Test -> Certificate
// Plan -Remaining Days
// Proficiency
// Interation in main page