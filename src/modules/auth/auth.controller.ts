import { Router } from "express";
import type { Request, Response } from "express";
import authService from "./auth.service";



const router = Router()

router.post('/login', (req: Request, res: Response) => {
    let loginData = authService.login(req.body)
    res.json({ message: "data from login", loginData })
})



export default router