const express = require('express');
const app = express();

app.use(express.urlencoded({extended: true})); // POST Value transfer
app.use(express.static('assets')); // Static files support in directory of assets
app.set('view engine','ejs'); // Templete Engine

app.listen(8080,()=>{
    console.log('listening on 8080')
})
//MONGO DB Connection---------------------------------------------------------
const MongoClient = require('mongodb').MongoClient;
var data;
MongoClient.connect('mongodb+srv://admin:--mongopark85@cluster0.maab1cf.mongodb.net/?retryWrites=true&w=majority',(err, client)=>{
    if(err) return console.log(err);
    data = client.db('e-learning'); // client.db('DB name')
})

// GET REQ (main.ejs)
app.get('/',(req,res)=>{
    res.render('main.ejs');
})
// GET REQ (signup.html)
app.get('/signup',(req,res)=>{
    res.render('signup.ejs');
    // res.sendFile(__dirname+'/pages/signup.html');
})

// POST REQUEST
app.post('/add',(req,res)=>{
    res.send('sent!')
    data.collection('count').findOne({name:"userNum"},(err,result)=>{
        console.log(result.total);
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

app.get('/list',(req,res)=>{
    // Data ejection from DB
    // all data
    data.collection('db').find().toArray((error,result)=>{
        // console.log(result);
        res.render('list.ejs',{users:result});
    }); 
})

/* Functionalities
    - Login
    - Signup

*/