import { config } from "dotenv"
import path from "path"

config({ path: path.resolve(`./.env.${process.env.NODE_ENV}`) })

let PORT = process.env.SERVER_PORT
let MONGODB_URL = process.env.MONGODB_URL as string
// let PROJ_MOOD = process.env.MOOD
let SALT = process.env.SALT as string
let jwt_admin_signature = process.env.JWT_ADMIN_SIGNATURE as string
let jwt_user_signature = process.env.JWT_USER_SIGNATURE as string
let jwt_admin_refresh_signature = process.env.JWT_ADMIN_REFRESH_SIGNATURE as string
let jwt_user_refresh_signature = process.env.JWT_USER_REFRESH_SIGNATURE as string
let gmail_client_id = process.env.GMAIL_CLIENT_ID
// let base_url = process.env.BASE_URL
let redis_uri = process.env.REDIS_URI
let nodeMailer_app_password = process.env.NODEMAILER_APP_PASSWORD as string
let nodeMailer_app_email = process.env.NODEMAILER_APP_EMAIL as string
let AWS_REGION = process.env.AWS_REGION as string
let AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string
let AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string
let AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string
let AWS_EXPIRES_IN = process.env.AWS_EXPIRES_IN as string
let APPLICATION_NAME = process.env.APPLICATION_NAME as string
let ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? '16')
let ENC_KEY = process.env.ENC_KEY as string
export {
    PORT,
    MONGODB_URL,
    // PROJ_MOOD,
    // base_url,
    SALT,
    jwt_admin_signature,
    jwt_user_signature,
    jwt_admin_refresh_signature,
    jwt_user_refresh_signature,
    gmail_client_id,
    redis_uri,
    nodeMailer_app_password,
    nodeMailer_app_email,
    AWS_REGION,
    AWS_BUCKET_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_EXPIRES_IN,
    APPLICATION_NAME,
    ENC_IV_LENGTH,
    ENC_KEY
}
