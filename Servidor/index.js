var path = require('path'), fs = require('fs'), exphbs = require('express-handlebars');
var bodyparser = require('body-parser');
var express=require('express');
var app = require('express')();
var morgan = require('morgan');//para lso mensajes de consola
var cookieParser = require('cookie-parser');//cookies

var servidor = require('http').createServer(app);
servidor = app.listen(process.env.PORT || 3000, function(){
    console.log('Listening in port %d', servidor.address().port);
});

var io = require('socket.io').listen(servidor);

var Sequelize = require('sequelize');
var db = null;

var session = require('express-session');
app.use(session({
                  resave:true,
                  saveUninitialized:true,
                  secret:'uwotm8'
                })
);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(bodyparser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


app.use(express.static(__dirname + '/public'));

// CONEXION OPENSHIFT

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);  
app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"); 

// CONEXION BASE DE DATOS

// database config


if (process.env.DATABASE_URL) {
  // the application is executed on Heroku ... use the postgres database
  db = new Sequelize(process.env.DATABASE_URL);
} else {
    // the application is executed on the local machine ... use mysql
    // var db = new sqlze('databasename', 'username', 'password',{
    db = new Sequelize('proyecto', 'root', 'zubiri',{
      dialect: 'mysql',
      port: 3306
    });
}

db.authenticate().complete(function(err){
  if(!!err) {
    console.log('Unable to connect to database: ', err);
  } else {
    console.log('Connection OK!');
  }
});

app.get('/', function(req, res){

  res.render('index', req.session.usuario);

});

app.get('/cerrarSesion', function(req, res){

  req.session.usuario = null;
  res.redirect("/");

});

// PAGINA LOGIN


app.get('/login/:error?', function(req, res){

  var error = "";
  if(req.params.error=="Passinc")
    error={error:"Password incorrecto"};
  if(req.params.error=="Usuinc")
    error={error:"Usuario incorrecto"};
    res.render('login',error);
});

// PAGINA CLIENTE FINAL
app.get('/clienteFinal', function(req, res){

 res.render('clienteFinal');

});

app.post('/registro', function(req, res){
  res.send(req.body);
});

app.get('/registro', function(req, res){

 res.render('registro');

});

app.get('/mapa', function(req, res){

 res.render('mapa');

});

// PAGINA RECINTO
app.get('/recinto', function(req, res){
  var recinto = {recinto: "1"};
  res.render('recinto', recinto);

});

// ENCRIPTAR CONTRASEÑA EN NODE

function encriptar(user, pass) {
   var crypto = require('crypto')
   // usamos el metodo CreateHmac y le pasamos el parametro user y actualizamos el hash con la password
   var hmac = crypto.createHmac('sha1', user).update(pass).digest('hex')
   return hmac
}

// TRATAMIENTO ENVIO DE LOGIN
app.post('/log', function(req, res){
 
  db.query('SELECT Password, idUsuarios FROM Usuarios where User="'+ req.param("usuario")+'";').success(function(rows){
    // no errors
    var usuario = req.body.usuario;
    var password = req.body.pass;

    var pass = encriptar(usuario, password);

    if(rows[0].Password.toString() == pass){
      
      db.query('SELECT idRecinto FROM Login where idUsuarios="'+ rows[0].idUsuarios+'";').success(function(rowsa){
        // no errors
        var idRec = rowsa[0].idRecinto.toString();
        req.session.usuario={ "recinto" : idRec ,"usuario": usuario };
        res.send("ok");
      });

    }else{
    
      res.send("Password incorrecto");
    }

    }).error(function (err){  
  
      res.send("Usuario incorrecto");
    });
});

// ENSEÑAR MUJERES HOMBRES DE CADA RECINTO PARA EL CLIENTE FINAL
app.get('/listaRecintos', function(req, res) {

  // Raw query
  db.query('SELECT * FROM Recintos;').success(function(rows){
    // no errors
    console.log(rows);
    res.json(rows);

  });

});

// MUJERES HOMBRES QUE HAY EN EL RECINTO PARA EL CLIENTE MEDIO Y PODER EDITARLO
app.get('/cantidadRecinto/:recinto', function(req, res) {

  // Raw query
  db.query('SELECT Mujeres,Hombres FROM Recintos WHERE idRecintos="'+req.params.recinto+'";').success(function(rows){
    // no errors
    console.log(rows);
    res.json(rows);

  });

});


// UPDATE DE LA BASE DE DATOS CADA VEZ QUE SE LE DA AL BOTON MAS O MENOS
app.post('/modificarCantidadRecinto/:dato/:recinto', function(req, res) {

  var columna = "";
  var valor = "";

  switch(req.params.dato){

    case "mujeresMas": 
      columna = "Mujeres";
      valor = "+1";
      break;

    case "mujeresMenos":
      columna = "Mujeres";
      valor = "-1";
      break;

    case "hombresMas":
      columna = "Hombres";
      valor = "+1";
      
      break;

    case "hombresMenos":
      columna = "Hombres";
      valor = "-1";
      break;

  }

  // Raw query
  db.query('UPDATE Recintos SET ' + columna + ' = ' + columna + valor +' WHERE idRecintos="'+req.params.recinto+'";').success(function(rows){
    // no errors

   // res.sendFile(__dirname + '/ClienteMedio/index.html');

  });
 db.query('SELECT '+ columna+' FROM Recintos WHERE idRecintos="'+req.params.recinto+'";').success(function(rows){
    // no errors
      io.sockets.emit('cambiorecinto', {"id":req.params.recinto,"columna":columna, "numero": rows});
      console.log("kk")
  });
});


