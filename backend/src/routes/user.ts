import express from 'express';
import cors from 'cors';
import { verifyJwt } from '../middlewares';
import { Request } from 'express-jwt';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const UserRouter = express.Router();
const prisma = new PrismaClient();
UserRouter.use(cors());
UserRouter.use(express.json());
interface UserInfo{
    sub:string,
    given_name : string,
    family_name:string,
    nickname:string,
    pricture:string,
    updated_at:string,
    email:string,
    email_verified:boolean
}

UserRouter.post('/:email',verifyJwt,async (req:Request,res) => {
    try {
        const id = req.auth?.sub?.split('|')[1] as string;  // Extract the token
        const useremail = req.params.email;
        const user = await prisma.user.findFirst({
            where:{
                id:id,
                email:useremail
            }
        })
        if(user){
            return res.json({
                message:'user logged in successfully'
            })
        }
        await prisma.user.create({
            data:{
                id:id,
                email:useremail
            }
        })
        return res.json({
            message : "user created successfully"
        })

        
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching user details',
            error: error
        });
    }
})


export default UserRouter;