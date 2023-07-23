const path = require('path')
const fs = require('fs');
const usersJSON = path.join(__dirname, '../data/users.json');
const users = JSON.parse(fs.readFileSync(usersJSON, 'utf-8'))
const { validationResult, body, cookie } = require('express-validator');
const AWS = require('aws-sdk'); // <-- Agrega esta línea

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Corrige el desfase de tiempo
AWS.config.systemClockOffset = 0;

const controllerUser = {

    fileName: usersJSON,

    getData: () => {
        return JSON.parse(fs.readFileSync(controllerUser.fileName, 'utf-8'));
    },

    findAll: () => {
        return controllerUser.getData();
    },

    findByPk: (id) => {
        let allUser = controllerUser.findAll();
        let userFound = allUser.find(oneUser => oneUser.id === id)
        return userFound;
    },

    findByField: (field, text) => {
        let allUser = controllerUser.findAll();
        let userFound = allUser.find(oneUser => oneUser[field] === text)
        return userFound;
    },

    create: (userData) => {
        let allUser = controllerUser.findAll();
        let newUser = {
            id: controllerUser.generateId(),
            ...userData
        }
        allUser.push(newUser);
        fs.writeFileSync(controllerUser.fileName, JSON.stringify(allUser, null, ' '));
        return newUser
    },

    generateId: () => {
        let allUser = controllerUser.findAll();
        let lastUser = allUser.pop();
        if(lastUser){
            return lastUser.id + 1;
        }
        return 1;
    },

    registerProcess: (req,res) => {
        
        const resultValidation = validationResult(req);
        if(resultValidation.errors.length > 0){
            return res.render('users/register', {
                errors: resultValidation.mapped(),
                oldData: req.body
            });
        }
        
        let userInDB = controllerUser.findByField('email', req.body.email)
        
        if(userInDB){
            return res.render('users/register', {
                errors: {
                    email:{
                        msg: "Este email ya esta registrado"
                    }
                },
                oldData: req.body
            });
        }
        
        let userToCreate = {
            ...req.body,
        }
        
        let userCreate = controllerUser.create(userToCreate)

        // Configura el SDK con tus credenciales
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        // Crea un objeto S3
        const s3 = new AWS.S3();

        // Lee el archivo .json de tu sistema de archivos
        const fileContent = fs.readFileSync(usersJSON); // <-- Cambia 'userCreate.json' a 'users.json'

        // Define los parámetros para la subida
        const params = {
            Bucket: 'bolitofx',
            Key: 'users.json', // Nombre del archivo a guardar en S3
            Body: fileContent
        };

        // Imprime el nombre del bucket para asegurarte de que se está estableciendo correctamente
        console.log("Bucket name: ", process.env.S3_BUCKET_NAME);

        // Sube el archivo a S3
        s3.upload(params, function(err, data) {
            if (err) {
                throw err;
            }
            console.log(`Archivo subido exitosamente a ${data.Location}`);
        });

        // redirect to WhatsApp with message
        let whatsappMessage = `Hola, le habla ${userCreate.nombre} ${userCreate.apellido}. Me comunico con usted para consultar si cuento con la posibilidad de obtener mi sesión de asesoría gratuita`;
        let encodedMessage = encodeURIComponent(whatsappMessage);
        return res.redirect(`https://wa.me/+593987524032?text=${encodedMessage}`);
    },
    
    register: (req,res) =>{
        res.render("users/register")
    },
}

module.exports = controllerUser;
