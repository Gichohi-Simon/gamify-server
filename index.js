import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import productRoutes from "./routes/product.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

dotenv.config();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/product", productRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/order", orderRoutes);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`server has started on port ${PORT}🔥`);
});
