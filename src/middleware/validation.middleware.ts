

import type { NextFunction, Request, Response } from "express"
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../common/exceptions/application.exceptions";

type ValidationKey = keyof Request
type ValidationSchema = Partial<Record<ValidationKey, ZodType>>

export const validation = (schema: ValidationSchema) => {
  return ((req: Request, res: Response, next: NextFunction) => {
    console.log(Object.keys(schema));
    let validationError: { key: ValidationKey, issue: ZodError["issues"] }[] = []

    for (const key of Object.keys(schema) as ValidationKey[]) {
      if (!schema[key]) {
        continue
      } else {

        const value = schema[key].safeParse(req[key])

        if (!value.success) {
          validationError.push({ key, issue: value.error.issues })
        }

      }
    }

    if (validationError.length > 0) {
      throw new BadRequestException('validation error', validationError)
    }

    next()
  })
}





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