import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) return res.status(401).json({ message: "token not found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isBanned: true,
        authProvider: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive || user.isBanned) {
      return res
        .status(403)
        .json({ message: "Account disabled, contact admin" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "not authorized" });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role === "ADMIN") return next();
  return res.status(403).json({ message: "only admin can access" });
};

export const authorizeAdminOrEmployee = (req, res, next) => {
  if (req.user?.role === "ADMIN" || req.user?.role === "EMPLOYEE")
    return next();
  return res.status(403).json({ message: "Admin or employees only" });
};
