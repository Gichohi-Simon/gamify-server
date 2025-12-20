import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const userSelect = {
  id: true,
  username: true,
  email: true,
  isAdmin: true,
  isActive: true,
  createdAt: true,
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
    });

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDeletedAccounts = async (req, res) => {
  try {
    const deletedAccounts = await prisma.user.findMany({
      where: {
        isActive: false,
      },
      select: userSelect,
    });
    res.status(200).json({ deletedAccounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: userSelect,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userAccountDeletion = async (req, res) => {
  const id = req.user.id;
  try {
    const deletedAccount = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
      select: userSelect,
    });

    res.status(201).json({ deletedAccount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreBannedUserToPlatform = async (req, res) => {
  const id = req.user.id;
  try {
    const restoredAccount = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
      select: userSelect,
    });
    res.status(201).json({ restoredAccount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const banUserFromPlatform = async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
      select: userSelect,
    });
    res.status(200).json({ deletedUser });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const makeAdmin = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isAdmin: true,
      },
      select: userSelect,
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const removeAdmin = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isAdmin: false,
      },
      select: userSelect,
    });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
