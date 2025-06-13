import Joi from "joi";
/**
const signUpSchema = Joi.object({
    email: Joi.string().min(5).max(60).required().email({
        tlds: {allow: false},
    }),
    password: Joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};:\'",.<>/?]).{8,}$'))
    .messages({
        'string.pattern.base': `Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.`,
        'string.empty': `Password cannot be empty.`,
        'any.required': `Password is required.`
    })
});

export default  signUpSchema;

const signInSchema = Joi.object({
    email: Joi.string().min(5).max(60).required().email({
        tlds: {allow: false},
    }),
    password: Joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};:\'",.<>/?]).{8,}$'))
    .messages({
        'string.pattern.base': `Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.`,
        'string.empty': `Password cannot be empty.`,
        'any.required': `Password is required.`
    })
});
 */

 const emailSchema = Joi.string().min(5).max(60).required().email({
  tlds: { allow: ['com', 'net'] }
});

const passwordSchema = Joi.string().required().pattern(
  new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};:\'",.<>/?]).{8,}$')
).messages({
  'string.pattern.base': `Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.`,
  'string.empty': `Password cannot be empty.`,
  'any.required': `Password is required.`
});

const providedCodeValue = Joi.number().required()

const signUpSchema = Joi.object({ email: emailSchema, password: passwordSchema });
const signInSchema = Joi.object({ email: emailSchema, password: passwordSchema });
const acceptedCodeValue = Joi.object({ email: emailSchema, providedCodeValue})

export { signUpSchema, signInSchema, acceptedCodeValue };
