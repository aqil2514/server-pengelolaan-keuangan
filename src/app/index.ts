import express, { Express } from "express";
import dotenv from "dotenv";
// import { clientEndpoint } from "./lib/data";
import bodyParser from "body-parser";
import cors from "cors";
import accountRoute from "./router/account";
import transactionRoute from "./router/transaction";
import assetsRouter from "./router/assets";
import settingRoute from "./router/setting";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const account = accountRoute;
const transaction = transactionRoute;
const assets = assetsRouter;
const setting = settingRoute;

app.use('/api/account', account);
app.use("/api/transaction", transaction)
app.use("/api/assets", assets)
app.use("/api/setting", setting)

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(port, () => {
  console.info(`[server]: Server is running at http://localhost:${port}`);
});

export default app;