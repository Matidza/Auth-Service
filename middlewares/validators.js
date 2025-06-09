import Joi from "joi";

const signUpSchema = Joi.object({
    email: Joi.string().min(5).max(60).required().email({
        tlds: {allow: ['com', 'net']},
    }),
    password: Joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};:\'",.<>/?]).{8,}$'))
    
});

export default  signupSchema;
/**
 
 .messages({
        'string.pattern.base': `Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character.`,
        'string.empty': `Password cannot be empty.`,
        'any.required': `Password is required.`
    })

 */