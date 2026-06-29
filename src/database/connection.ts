import mongoose from "mongoose";
import { MONGODB_URL } from "../config/env.service";


const DBconnection = () => {
    mongoose.connect(MONGODB_URL).then(() => console.log("MongoDB database connected"))
        .catch((err) => console.log(err))
}


export default DBconnection