import express from 'express';
import cors from 'cors';
import StreamRouter from './streams';
import UserRouter from './user';

const RootRouter = express.Router();

RootRouter.use(cors());

RootRouter.use('/streams',StreamRouter);
RootRouter.use('/user',UserRouter);


export default RootRouter;