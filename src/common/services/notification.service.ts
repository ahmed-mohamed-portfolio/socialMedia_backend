
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import { resolve } from "path";


export class NotificationService {

    constructor() {

        //BUILD_Connection
        const serviceAccount = JSON.parse(fs.readFileSync(resolve(process.cwd(), "src/config/sendtestnotification-ee4ea-firebase-adminsdk-fbsvc-e2a3d52687.json"), "utf8"));

        initializeApp({
            credential: cert(serviceAccount),
        });

    }

    sendNotificationToToken = async ({
        token,
        data
    }: {
        token: string,
        data: { title: string, body: any },
    }) => {
        const message = {
            token,
            data,
        };

        return await getMessaging().send(message);
    };


    sendNotificationToTokens = async ({
        tokens,
        data
    }: {
        tokens: string[],
        data: { title: string, body: any },
    }) => {

        await Promise.allSettled(
            tokens.map((token => {
                return this.sendNotificationToToken({
                    token,
                    data
                })
            }))

        )


    };
}

export const notificationService = new NotificationService()
