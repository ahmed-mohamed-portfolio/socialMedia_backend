import { Router } from "express"
import type { Request, Response } from "express"
import authService from "./auth.service"
import { SuccessResponse } from "../../common/exceptions/success.response"
import { signinSchema, signupSchema, verifySchema } from "./auth.validation"
import { validation } from "../../middleware/validation.middleware"
import { BadRequestException, ConflictException } from "../../common/exceptions/application.exceptions"
import { authentication } from "../../middleware/auth.middleware"
import { cloudeFileUpload, fileFieldValidation } from "../../common/utils/multer"
import { StorageApproachEnum } from "../../common/enums"

const router = Router()

router.post("/signin", validation(signinSchema), async (req: Request, res: Response) => {
    let host = `${req.protocol}://${req.host}`

    let data = await authService.login(req.body, host)


    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    SuccessResponse({ res, message: "signin success", data })
})

router.post("/signup", validation(signupSchema), async (req: Request, res: Response) => {
    let data = await authService.signup(req.body)
    SuccessResponse({ res, message: "success", data })
})

router.post("/verify", validation(verifySchema), async (req: Request, res: Response) => {
    let data = await authService.verifyEmail(req.body)
    return SuccessResponse({ res, message: "email verified", status: 200, data })
})

const getCookieValue = (req: Request, key: string) => {
    const cookies = req.headers.cookie
    if (!cookies) {
        return null
    }

    for (const cookie of cookies.split(";")) {
        const [cookieKey, ...cookieValueParts] = cookie.trim().split("=")
        if (cookieKey === key) {
            return decodeURIComponent(cookieValueParts.join("="))
        }
    }

    return null
}

router.post("/signup/gmail", async (req: Request, res: Response) => {


    //? i used this email ==> ahmed.mohamed.connect@gmail.com

    //req.headers.cookie ==> this dont work till front and back in same domain or local host

    const csrfCookie = getCookieValue(req, "g_csrf_token");
    const csrfBody = req.body?.g_csrf_token;

    if (!csrfCookie || !csrfBody || csrfCookie !== csrfBody) {
        throw new ConflictException("Invalid Google CSRF token");
    }

    let host = `${req.protocol}://${req.host}`

    let { message, status, data } = await authService.signupWithGmail(req.body.credential, host)


    // if success

    res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    })


    res.cookie("accessToken", data.accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/"
    })

    return res.redirect("http://localhost:4200/timeLine")
})

router.patch("/logout-from-all-devices", authentication, async (req: Request, res: Response) => {

    await authService.logOutFromAllDevices(req.userId)


    res.clearCookie("accessToken", {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });


    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });


    return SuccessResponse({ res, message: 'logged out from all devices successfully', status: 200 })

})

router.post("/logout", authentication, async (req: Request, res: Response) => {

    await authService.logOut(req.userId, req.jti)


    res.clearCookie("accessToken", {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: "/"
    });
    return SuccessResponse({ res, message: 'logged out successfully', status: 200 })

})

router.get('/generate-access-token', async (req: Request, res: Response) => {

    // console.log("i am here generate-access-tokengenerate-access-token");

    // console.log("req.cookies.refreshTokenreq.cookies.refreshToken", req.cookies.refreshToken);

    let accessToken = await authService.generateAccessToken(req.cookies.refreshToken)

    res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: "/"
    })
    return SuccessResponse({ res, message: 'access token created', status: 200, })

})

router.get('/get-user-profile', authentication, async (req: Request, res: Response) => {
    console.log("req.userId", req.userId);

    let userData = await authService.getUserProfile(req.userId)

    if (!userData) {
        throw new BadRequestException("cant get user")
    }

    SuccessResponse({ res, message: "done", status: 200, data: userData })
})

router.patch('/profile-image', authentication, cloudeFileUpload({ StorageApproach: StorageApproachEnum.DISK, validation: fileFieldValidation.image, maxSize: 200 }).single("attachment"), async (req: Request, res: Response) => {

    let userData = await authService.profileImage(req.file as Express.Multer.File, req.userId)

    if (!userData) {
        throw new BadRequestException("cant uploade image")
    }

    SuccessResponse({ res, data: userData })
})

router.patch('/profile-image-byPreSignedLink', authentication, async (req: Request, res: Response) => {

    let userData = await authService.profileImageByPreSignedLink(req.body, req.userId)

    if (!userData) {
        throw new BadRequestException("cant get preSignedLink")
    }

    SuccessResponse({ res, data: userData })
})

router.patch('/profile-cover-images', authentication, cloudeFileUpload({ StorageApproach: StorageApproachEnum.DISK, validation: fileFieldValidation.image, maxSize: 20 }).array("attachments", 2), async (req: Request, res: Response) => {
    console.log("req.files", req.files);

    let userData = await authService.profileCoverImages(req.files as Express.Multer.File[], req.userId)

    if (!userData) {
        throw new BadRequestException("cant uploade images")
    }

    SuccessResponse({ res, data: userData })
})
export default router
