const express =require('express');
let router = express.Router();
const Usuario = require('../../../../libs/usuarios');
const UsuarioDao = require('../../../../dao/mongodb/models/UsuarioDao');
const userDao = new UsuarioDao();
const user = new Usuario(userDao);
const nodemailer = require('nodemailer');
user.init();

const {jwtSign} = require('../../../../libs/security');
const { application } = require('express');

router.post('/login', async (req, res)=>{
  try {
    const {email, password} = req.body;
    const userData = await user.getUsuarioByEmail({email});
    if(! user.comparePasswords(password, userData.password) ) {
      console.error('security login: ', {error:`Credenciales para usuario ${userData._id} ${userData.email} incorrectas.`});
      return res.status(403).json({ "error": "Credenciales no Válidas" });
    }
    const {password: passwordDb, created, updated, ...jwtUser} = userData;
    const jwtToken = await jwtSign({jwtUser, generated: new Date().getTime()});
    return res.status(200).json({token: jwtToken});
  } catch (ex) {
    console.error('security login: ', {ex});
    return res.status(500).json({"error":"No es posible procesar la solicitud."});
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email = '',
      password = ''
    } = req.body;
    if (/^\s*$/.test(email)) {
      return res.status(400).json({
        error: 'Se espera valor de correo'
      });
    }

    if (/^\s*$/.test(password)) {
      return res.status(400).json({
        error: 'Se espera valor de contraseña correcta'
      });
    }
    const newUsuario = await user.addUsuarios({
      email,
      nombre : 'John Doe',
      avatar: '',
      password,
      estado: 'ACT'
    });
    return res.status(200).json(newUsuario);
  } catch (ex) {
    console.error('security signIn: ', ex);
    return res.status(502).json({ error: 'Error al procesar solicitud' });
  }
});

// OLVIDO CONTRASEÑA Y SE MANDA UNA TEMPORAL, USO DE NODEMAILER
router.post('/forgotPassword', (req, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: 'hhahzcnwsestkbog@ethereal.email',
      pass: 'dQwu35NcMQ5vpaA5WT'
    },
  });

  var mailOptions = {
    from: "Remitente",
    to: "jahnca1501@gmail.com",
    subject: "Nueva contraseña temporal",
    text: "Su nueva contraseña temporal es:  " + generatePasswordRand(8),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(500).send(error.message);
    } else {
      console.log("Email enviado");
      res.status(200).jsonp(req.body);
    }
  });
});

router.patch("/reset", (req, res) => {

})

// FUNCION PARA GENERAR CONTRASEÑA ALEATORIA
function generatePasswordRand(length,type) {
  switch(type){
      case 'num':
          characters = "0123456789";
          break;
      case 'alf':
          characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
          break;
      case 'rand':
          //FOR ↓
          break;
      default:
          characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          break;
  }
  var pass = "";
  for (i=0; i < length; i++){
      if(type == 'rand'){
          pass += String.fromCharCode((Math.floor((Math.random() * 100)) % 94) + 33);
      }else{
          pass += characters.charAt(Math.floor(Math.random()*characters.length));   
      }
  }
  return pass;
}

module.exports = router;
