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

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        msg: "user already exists",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    delete savedUser.password;

    res.status(201).json({ user: savedUser });
  } catch (error) {
    res.status(500).json({
      error: error.message,
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

    if (!user) return res.status(400).json({ error: "user does not exist" });

    if (user.isActive !== true)
      return res
        .status(400)
        .json({ error: "account has been deleted,contact admin" });

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch)
      return res.status(400).json({ msg: "passwords do not match" });

    createToken(res, user.id);

    delete user.password;

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const logoutCurrentUser = async (req, res) => {
  res.clearCookie("jwt", " ", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".gamifygeneralsupplies.co.ke",
  });

  res.status(200).json({
    message: "logged out succesfully",
  });
};

export const checkCookie = async (req, res) => {
  const token = req.cookies.jwt;

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
    res.status(401).json({ message: error.message });
  }
};
