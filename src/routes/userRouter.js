const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');

const validations = [
  body('nombre').notEmpty().withMessage('Debes ingresar un nombre'),
  body('apellido').notEmpty().withMessage('Debes ingresar un apellido'),
  body('email')
    .notEmpty().withMessage('Debes ingresar un correo electrónico').bail()
    .isEmail().withMessage('Debes ingresar un formato de correo válido'),
  body('telefono').notEmpty().withMessage('Debes ingresar un número de teléfono')
];

userRouter.get('/register', userController.register);
userRouter.post('/register', validations, userController.registerProcess);

module.exports = userRouter;
