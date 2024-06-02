import express, { Express } from "express";
import dotenv from "dotenv";
// import { clientEndpoint } from "./lib/data";
import bodyParser from "body-parser";
import cors from "cors";
import accountRoute from "./router/account";
import transactionRoute from "./router/transaction";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const account = accountRoute;
const transaction = transactionRoute;

app.use('/api/account', account);
app.use("/api/transaction", transaction)

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;