import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "all fields are required" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        msg: "Account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const savedUser = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    });

    res.status(201).json({ user: savedUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Something went wrong. Please try again later",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    if (!user.isActive || user.isBanned)
      return res
        .status(403)
        .json({ message: "Account is inactive or banned, contact admin" });

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    createToken(res, user.id);

    delete user.password;

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "something went wrong please try again",
    });
  }
};

export const logoutCurrentUser = async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".gamifygeneralsupplies.co.ke",
    path: "/",
  });

  res.status(200).json({
    message: "logged out succesfully",
  });
};

export const checkCookie = async (req, res) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ message: "user not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error.message);
    return res
      .status(401)
      .json({ message: "Inavalid or expired token. Please log in again" });
  }
};
