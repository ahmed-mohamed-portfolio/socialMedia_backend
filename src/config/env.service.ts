import { config } from "dotenv"
import path from "path"

config({ path: path.resolve(`./.env.${process.env.NODE_ENV}`) })

let PORT = process.env.SERVER_PORT
let MONGODB_URL = process.env.MONGODB_URL as string
// let PROJ_MOOD = process.env.MOOD
let SALT = process.env.SALT as string
// let jwt_key = process.env.JWT_KEY
// let jwt_admin_signature = process.env.JWT_ADMIN_SIGNATURE
// let jwt_user_signature = process.env.JWT_USER_SIGNATURE
// let jwt_admin_refresh_signature = process.env.JWT_ADMIN_REFRESH_SIGNATURE
// let jwt_user_refresh_signature = process.env.JWT_USER_REFRESH_SIGNATURE
// let gmail_client_id = process.env.GMAIL_CLIENT_ID
// let base_url = process.env.BASE_URL
// let redis_uri = process.env.REDIS_URI
let nodeMailer_app_password = process.env.NODEMAILER_APP_PASSWORD as string
let nodeMailer_app_email = process.env.NODEMAILER_APP_EMAIL as string

export {
    PORT,
    MONGODB_URL,
    // PROJ_MOOD,
    // base_url,
    SALT,
    // jwt_key,
    // jwt_admin_signature,
    // jwt_user_signature,
    // jwt_admin_refresh_signature,
    // jwt_user_refresh_signature,
    // gmail_client_id,
    // redis_uri,
    nodeMailer_app_password,
    nodeMailer_app_email
}
