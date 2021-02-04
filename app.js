const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
var admin = require('firebase-admin');

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'murakami3',	
    database: 'list_app'
  });

  app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use((req, res, next) => {
    if (req.session.userId === undefined) {
      res.locals.userName = 'Guest';
      res.locals.isLoggedIn = false;
    } else {
      res.locals.userName = req.session.userName;
      res.locals.isLoggedIn = true;
    }
    next();
  });

app.get('/top', (req, res) => {
  res.render('top.ejs');
});
app.get('/list',(req,res)=>{
    if(req.session.userId===undefined){
      res.render('signup.ejs',{errors:[]});
    }else{
      const writer = res.locals.userName;
      connection.query(
      'select * from lists where writer = ?',
      [writer],
      (error,results)=>{
        res.render('list.ejs',{lists:results});
      }
    );
    }
});
app.get('/login',(req,res)=>{
    res.render('login.ejs',{errors:[]});
});
app.post('/login',(req,res)=>{
    const email = req.body.email;
    const errors =[];
    connection.query(
        'select * from users where email=?',
        [email],
         (error, results)=> {
            if (results.length > 0) {
                const plain = req.body.password;
                const hash = results[0].password;
                bcrypt.compare(plain,hash,(error,isEqual)=>{
                    if (isEqual) {
                        req.session.userId=results[0].id;
                        req.session.userName=results[0].userName;
                        res.redirect('/list');
                    }else{
                        errors.push("Wrong password!");
                        console.log(errors);
                        res.render('login.ejs',{errors:errors});
                    }
                 }
                );
                
        }
        else{
            errors.push("Wrong email!");
            console.log(errors);
            res.render('login.ejs',{errors:errors});
        }
    }
    );
});
app.get('/signup',(req,res)=>{
    res.render('signup.ejs',{errors:[]});
});

app.post('/signup',
        (req,res,next)=>{
          var userName = req.body.userName;
          var email = req.body.email;
          var password = req.body.password;
        const errors = [];
        if(userName===""){
          errors.push("Tell us your username!");
        }
        if(email===""){
          errors.push("Tell us your email!")
        }
        if(password===""){
          errors.push("password?");
        }
        if(errors.length>0){
          console.log(errors);
          res.render('signup.ejs',{errors:errors});
        }else{
          next();
        }
        },

        (req,res)=>{
          const userName = req.body.userName;
          const email = req.body.email;
          const password = req.body.password;
        bcrypt.hash(password,10,(error,hash)=>{
        connection.query(
            'insert into users (userName,email,password) values(?,?,?)',
            [userName,email,hash],
            (error,results)=>{
                req.session.userName=userName;
                req.session.userId=results.insertId;
                res.redirect('/top');
            }
        );
        
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(error => {
      res.redirect('/top');
    });
  });
app.get('/addList',(req,res)=>{
    res.render('addList.ejs');
});
app.post('/addList',(req,res)=>{
    const writer = res.locals.userName;
    const task = req.body.task;
    const time = req.body.time;
    connection.query(
        'insert into lists (writer,task,time) values(?,?,?)',
        [writer,task,time],
        (error,results)=>{
            res.redirect('/list');
        }
    );
});
app.get('/edit/:id',(req,res)=>{
  connection.query(
  'select * from lists where id=?',
  [req.params.id],
  (error,results)=>{
    res.render('edit.ejs',{lists:results[0]});
  }
  );
});
app.post('/update/:id',(req,res)=>{
    const id = req.params.id;
    const task = req.body.task;
    const time = req.body.time;
    connection.query(
      'update lists set task=?, time=? where id=?',
      [task,time,req.params.id],
      (error,results)=>{
        res.redirect('/list')
      }
      );
});
app.post('/delete/:id',(req,res)=>{
  connection.query(
    'delete from lists where id=?',
    [req.params.id],
    (error,results)=>{
      console.log(results);
      res.redirect('/list');
    }
  );
});

app.listen(3000);