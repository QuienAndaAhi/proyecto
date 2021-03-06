var path = require('path'), fs = require('fs'), exphbs = require('express-handlebars');
var bodyparser = require('body-parser');
var express=require('express');
var app = express();
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000 , ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"; 
var servidor = require('http').createServer(app);

var io = require('socket.io').listen(servidor);

var Sequelize = require('sequelize');
var db = null;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(bodyparser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(express.static(__dirname + '/public'));

var session = require('express-session');
app.use(session({
                  resave:true,
                  saveUninitialized:true,
                  secret:'uwotm8'
                })
);

servidor.listen(port,ip);


// CONEXION BASE DE DATOS

// database config


if (process.env.OPENSHIFT_MYSQL_DB_URL) {
  // the application is executed on Heroku ... use the postgres database
console.log("openshift db");
     db = new Sequelize('proyecto', process.env.OPENSHIFT_MYSQL_DB_USERNAME, process.env.OPENSHIFT_MYSQL_DB_PASSWORD,{
      dialect: 'mysql',
      port: process.env.OPENSHIFT_MYSQL_DB_PORT,
      host: process.env.OPENSHIFT_MYSQL_DB_HOST
    });
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

console.log(port);
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

// PAGINA REGISTRAR FORMULARIO EN DB
app.post('/registro', function(req, res){
   db.query('INSERT INTO Usuarios(User,Password,Nombre,Apellido,Email,Propietario,Ciudad) VALUES ("'+req.body.usu+'", "'+encriptar(req.body.usu,req.body.pass)+'", "'+req.body.nombre+'", "'+req.body.apellido+'" ,"'+req.body.email+'",'+req.body.dueno+',"'+req.body.ciudad+' " );').success(function(rowsa){
        // no errors
      
        req.session.usuario=req.body;
        res.send(rowsa);
      }).error(function (err){  
  
      res.send("no ok");
    });
});

// PAGINA REGISTRAR FORMULARIO SI ES DUEÑO DE ALGUN RECINTO
app.post('/registrodueno', function(req, res){
    var idusuario="";
    var idrecinto="";
    //METER USUARIO
   db.query('INSERT INTO Usuarios(User,Password,Nombre,Apellido,Email,Propietario,Ciudad) VALUES ("'+req.body.usu+'", "'+encriptar(req.body.usu,req.body.pass)+'", "'+req.body.nombre+'", "'+req.body.apellido+'" ,"'+req.body.email+'",'+req.body.dueno+',"'+req.body.ciudad+' " );').success(function(rowsa){
        // NO HAY ERROR, COGER SU ID
        db.query('SELECT MAX(idUsuarios) "a" FROM Usuarios;').success(function(rowsa){
            idusuario=rowsa[0].a;
            console.log(idusuario);
        }).error(function (err){ 
        res.send(err); 
        });
        //METER RECINTO
        db.query('INSERT INTO Recintos(Nombre, Direccion, Descripcion) VALUES("'+req.body.nombrerecinto+'","'+req.body.direccion+'","'+req.body.descripcion+'");').success(function(rowsa){
                       //NO HAY ERROR COGER ID RECINTO
                       db.query('SELECT MAX(idRecintos) "a" FROM Recintos;').success(function(rowsa){
                          idrecinto=rowsa[0].a;
                          console.log(idrecinto);
                          //DESPUES DE COGER EL IDRECINTO, INSERTAR LOS DOS IDS EN LA TABLA-RELACION LOGIN
                          db.query('INSERT INTO Login(idRecinto,idUsuarios) VALUES('+idrecinto+','+idusuario+');').success(function(rowsa){
                            res.send("todo correcto");
                            req.session.usuario=req.body;
                           }).error(function (err){  
                            //SI FALLA EL INSERT EN LOGIN, BORRAR LOS INSERTS QUE SE HAN HECHO ANTES
                              db.query('DELETE FROM Usuarios WHERE idUsuarios ='+idusuario+';').success(function(rowsa){
                               }).error(function (err){  
                                 res.send(err);
                              });
                              db.query('DELETE FROM Recintos WHERE idRecintos ='+idrecinto+';').success(function(rowsa){
                               }).error(function (err){  
                                 res.send(err);
                              });
                          });
                        }).error(function (err){
                         res.send(err);  
                      });
           //SI FALLA EL INSERT EN RECINTO, BORRAR LOS INSERTS QUE SE HAN HECHO ANTES            
          }).error(function (err){ 
                       db.query('DELETE FROM Usuarios WHERE idUsuarios ='+idusuario+';').success(function(rowsa){
                        }).error(function (err){  
                           res.send(err);
                        });
          });    
        
    
      }).error(function (err){  
  
      res.send("no ok");
    });
});

// PAGINA REGISTRO
app.get('/registro', function(req, res){

 res.render('registro');

});

// PAGINA MAPA GOOGLE CON ESTABLECIMIENTOS
app.get('/mapa', function(req, res){

 res.render('mapa');

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
 
  db.query('SELECT Password, idUsuarios, Propietario FROM Usuarios WHERE User="'+ req.param("usuario")+'";').success(function(rows){
    // no errors
    var usuario = req.body.usuario;
    var password = req.body.pass;
    var dueno = rows[0].Propietario;
    var pass = encriptar(usuario, password);

    if(rows[0].Password.toString() == pass){
       if(dueno=="1"){
        db.query('SELECT idRecinto FROM Login WHERE idUsuarios="'+ rows[0].idUsuarios+'";').success(function(rowsa){
          // no errors
          var idRec = rowsa[0].idRecinto.toString();
           db.query('SELECT Nombre FROM Recintos WHERE idRecintos="'+ idRec +'";').success(function(rowsb){
             req.session.usuario={ "recinto": idRec ,"usu": usuario,"propietario": dueno , "NomRec": rowsb[0].Nombre.toString()};
            res.send("ok");
           
          
          });

          
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
 
  db.query('SELECT count(*) "a" FROM Usuarios WHERE Email="'+ req.body.email+'";').success(function(rows){
    // no errors

    if(rows[0].a > 0 ){
      res.send("Email ocupado");
    

    }else{
      db.query('SELECT count(*) "a" FROM Usuarios WHERE User="'+ req.body.signup+'";').success(function(rowsa){
        // no errors
        console.log('SELECT count(*) "a" FROM Usuarios WHERE User="'+ req.body.signup+'";');
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

       db.query('SELECT '+ columna+' FROM Recintos WHERE idRecintos="'+req.params.recinto+'";').success(function(rows){
          // no errors
            io.sockets.emit('cambiorecinto', {"id":req.params.recinto,"columna":columna, "numero": rows});

            console.log("/modificarCantidadRecinto/");
            console.log(rows);

             res.send("posa");
        }).error(function (err){  
  
            res.send("Error");
        });

  }).error(function (err){  
  
      res.send("Error");
    });

});


