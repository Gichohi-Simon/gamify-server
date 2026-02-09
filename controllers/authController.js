import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// google client (id token verification)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildUsername = (name, email) => {
  if (name && name.trim().length > 0) return name.trim();
  if (email) return email.split("@")[0];
  return "user";
};

export const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const savedUser = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
        authProvider: "LOCAL",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        authProvider: true,
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
    if (!email || !password) {
      return res.status(400).json({
        message: "email and password required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive || user.isBanned)
      return res
        .status(403)
        .json({ message: "Account is inactive or banned, contact admin" });

    if (!user.password) {
      return res.status(400).json({
        message: "This account does not use password login",
      });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    createToken(res, user.id, user.role);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
    };

    res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "something went wrong please try again",
    });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "email and password required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive || user.isBanned)
      return res
        .status(403)
        .json({ message: "Account is inactive or banned, contact admin" });

    const allowedRoles = ["ADMIN", "EMPLOYEE"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (user.authProvider !== "LOCAL") {
      return res
        .status(403)
        .json({ message: "Admins must log in with email + password" });
    }

    if (!user.password) {
      return res
        .status(500)
        .json({ message: "Admin account misconfigured (missing password)" });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    createToken(res, user.id, user.role);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
    };

    res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "admin login failed",
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
        role: true,
        authProvider: true,
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
      .json({ message: "Invalid or expired token. Please log in again" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    // frontend sends Google ID token
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "idToken is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload)
      return res.status(401).json({ message: "Invalid Google token" });

    const googleSub = payload.sub;
    const email = (payload.email || "").toLowerCase().trim();
    const name = payload.name || payload.given_name || "";

    if (!googleSub || !email) {
      return res
        .status(400)
        .json({ message: "Google token missing sub/email" });
    }

    let user = await prisma.user.findUnique({
      where: { googleSub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        authProvider: true,
        isActive: true,
        isBanned: true,
        googleSub: true,
      },
    });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          authProvider: true,
          isActive: true,
          isBanned: true,
          googleSub: true,
        },
      });

      if (existingByEmail) {
        if (
          existingByEmail.googleSub &&
          existingByEmail.googleSub !== googleSub
        ) {
          return res.status(409).json({
            message: "This email is already linked to another Google account",
          });
        }

        user = await prisma.user.update({
          where: {
            id: existingByEmail.id,
          },
          data: {
            googleSub,
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            authProvider: true,
            isActive: true,
            isBanned: true,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            username: buildUsername(name, email),
            googleSub,
            authProvider: "GOOGLE",
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            authProvider: true,
            isActive: true,
            isBanned: true,
          },
        });
      }
    }

    if (!user.isActive || user.isBanned) {
      return res
        .status(403)
        .json({ message: "Account deleted, contact admin" });
    }

    createToken(res, user.id, user.role);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
    };

    return res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(401).json({
      message: "Google login failed",
    });
  }
};
