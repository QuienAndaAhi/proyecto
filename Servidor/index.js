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


  /*var usu={usu:req.session.usuario,};*/

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
   db.query('INSERT INTO Usuarios(user,Password,Nombre,Apellido,Email,Propietario,Ciudad) values ("'+req.body.usu+'", "'+encriptar(req.body.usu,req.body.pass)+'", "'+req.body.nombre+'", "'+req.body.apellido+'" ,"'+req.body.email+'",'+req.body.dueno+',"'+req.body.ciudad+' " );').success(function(rowsa){
        // no errors
      
        req.session.usuario=req.body;
        res.send(rowsa);
      }).error(function (err){  
  
      res.send("no ok");
    });
});
app.post('/registrodueno', function(req, res){
    var idusuario="";
    var idrecinto="";
    //METER USUARIO
   db.query('INSERT INTO Usuarios(user,Password,Nombre,Apellido,Email,Propietario,Ciudad) values ("'+req.body.usu+'", "'+encriptar(req.body.usu,req.body.pass)+'", "'+req.body.nombre+'", "'+req.body.apellido+'" ,"'+req.body.email+'",'+req.body.dueno+',"'+req.body.ciudad+' " );').success(function(rowsa){
        // NO HAY ERROR, COGER SU ID
        db.query('SELECT MAX(idUsuarios) "a" FROM Usuarios;').success(function(rowsa){
             idusuario=rowsa[0].a;
              console.log(idusuario);
        }).error(function (err){ 
        res.send(err); 
        });
        //METER RECINTO
        db.query('INSERT INTO recintos(Nombre,Direccion,Descripcion) values("'+req.body.nombrerecinto+'","'+req.body.direccion+'","'+req.body.descripcion+'");').success(function(rowsa){
                       //NO HAY ERROR COGER ID RECINTO
                       db.query('SELECT MAX(idRecintos) "a" FROM recintos;').success(function(rowsa){
                          idrecinto=rowsa[0].a;
                          console.log(idrecinto);
                          //DESPUES DE COGER EL IDRECINTO, INSERTAR LOS DOS IDS EN LA TABLA-RELACION LOGIN
                          db.query('INSERT INTO login(idRecinto,idUsuarios) values('+idrecinto+','+idusuario+');').success(function(rowsa){
                            res.send("todo correcto");
                            req.session.usuario=req.body;
                           }).error(function (err){  
                            //SI FALLA EL INSERT EN LOGIN, BORRAR LOS INSERTS QUE SE HAN HECHO ANTES
                              db.query('DELETE FROM Usuarios where idUsuarios ='+idusuario+';').success(function(rowsa){
                               }).error(function (err){  
                                 res.send(err);
                              });
                              db.query('DELETE FROM Recintos where idRecintos ='+idrecinto+';').success(function(rowsa){
                               }).error(function (err){  
                                 res.send(err);
                              });
                          });
                        }).error(function (err){
                         res.send(err);  
                      });
           //SI FALLA EL INSERT EN RECINTO, BORRAR LOS INSERTS QUE SE HAN HECHO ANTES            
          }).error(function (err){ 
                       db.query('DELETE FROM Usuarios where idUsuarios ='+idusuario+';').success(function(rowsa){
                        }).error(function (err){  
                           res.send(err);
                        });
          });    
        
    
      }).error(function (err){  
  
      res.send("no ok");
    });
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
 
  db.query('SELECT Password, idUsuarios, Propietario FROM Usuarios where User="'+ req.param("usuario")+'";').success(function(rows){
    // no errors
    var usuario = req.body.usuario;
    var password = req.body.pass;
    var dueno = rows[0].Propietario;
    var pass = encriptar(usuario, password);

    if(rows[0].Password.toString() == pass){
       if(dueno=="1"){
        db.query('SELECT idRecinto FROM Login where idUsuarios="'+ rows[0].idUsuarios+'";').success(function(rowsa){
          // no errors
          var idRec = rowsa[0].idRecinto.toString();
          req.session.usuario={ "recinto": idRec ,"usu": usuario,"propietario": dueno };

          res.send("ok");
        });
        }else{
           req.session.usuario={ "usu": usuario};
            res.send("ok");
        }
    }else{
    
      res.send("Password incorrecto");
    }

    }).error(function (err){  
  
      res.send("Usuario incorrecto");
    });
});
app.post('/regcomp', function(req, res){
 
  db.query('SELECT count(*) "a" FROM Usuarios where Email="'+ req.body.email+'";').success(function(rows){
    // no errors

    if(rows[0].a > 0 ){
      res.send("Email ocupado");
    

    }else{
      db.query('SELECT count(*) "a" FROM Usuarios where User="'+ req.body.signup+'";').success(function(rowsa){
        // no errors
        console.log('SELECT count(*) "a" FROM Usuarios where User="'+ req.body.signup+'";');
         if(rowsa[0].a > 0 ){
          res.send("Usuario ocupado");
          }
          else{
            res.send("ok");
          }
      });
    }

    }).error(function (err){  
  
      res.send("Error");
    });
});

// ENSEÑAR MUJERES HOMBRES DE CADA RECINTO PARA EL CLIENTE FINAL
app.get('/listaRecintos', function(req, res) {

  // Raw query
  db.query('SELECT * FROM Recintos LIMIT 9;').success(function(rows){
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


