"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const application_exceptions_1 = require("../common/exceptions/application.exceptions");
const validation = (schema) => {
    return ((req, res, next) => {
        console.log(Object.keys(schema));
        let validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key]) {
                continue;
            }
            const value = schema[key].safeParse(req[key]);
            if (!value.success) {
                validationError.push({ key, issue: value.error.issues });
            }
        }
        if (validationError.length > 0) {
            throw new application_exceptions_1.BadRequestException('validation error', validationError);
        }
        next();
    });
};
exports.validation = validation;
/*
يعني إيه keyof؟

keyof بتجيب أسماء المفاتيح الموجودة في Type معين.

مثال بسيط:

type User = {
  name: string
  age: number
}

type UserKeys = keyof User


هنا UserKeys تساوي:
"name" | "age"
*/
/*
Record<ValidationKey, ZodType>
اعمل object، مفاتيحه من نوع ValidationKey، وقيمه من نوع ZodType.

{
  body: ZodType,
  query: ZodType,
  params: ZodType,
  headers: ZodType,
  ...
}



Partial<Record<ValidationKey, ZodType>>
Partial معناها: خلي كل المفاتيح optional.

*/
/*

type User = {
  name: string
  age: number
}

type AgeType = User["age"]
هنا:
AgeType
هتكون:
number

*/
/*

const user = {
  name: "Ahmed",
  age: 25
}

console.log(user.name)
console.log(user["name"])

الاتنين هيطلعوا:
Ahmed
*/ 
