import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import RootRouter from "./routes";

dotenv.config();

const app: Express = express();
const port = 3000;

app.use('/api/v1',RootRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});