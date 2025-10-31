import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;
  if (!token) return res.status(404).json({ message: "token not found" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  next();
};

export const authorizeAdmin = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "only admin can access" });
  }
};
