import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createAddress = async (req, res) => {
  const userId = req.user.id;
  const { companyName, street, floorNumber, city, postalCode } = req.body;

  try {
    const existing = await prisma.deliveryAddress.findUnique({
      where: {
        userId,
      },
    });

    if (existing)
      return res
        .status(400)
        .json({ message: "Address already exists for this user" });

    const newAddress = await prisma.deliveryAddress.create({
      data: {
        companyName,
        street,
        floorNumber,
        city,
        postalCode,
      },
    });

    res.status(201).json({ newAddress });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  const { companyName, street, floorNumber, city, postalCode } = req.body;
  const userId = req.user.id;

  try {
    const addressIdExists = await prisma.deliveryAddress.findUnique({
      where: {
        userId,
      },
    });

    if (!addressIdExists)
      return res.status(404).json({ message: "Address not found" });

    const updatedAddress = await prisma.deliveryAddress.update({
      where: {
        userId,
      },
      data: {
        companyName,
        street,
        floorNumber,
        city,
        postalCode,
      },
    });

    res.status(200).json({ updatedAddress });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getLoggedInUserAddress = async (req, res) => {
  const userId = req.user.id;

  try {
    const address = await prisma.deliveryAddress.findUnique({
      where: {
        userId,
      },
    });
    if (!address) return res.status(404).json({ message: "No address found" });

    res.status(200).json({ address });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  const userId = req.user.id;
  try {
    const existing = await prisma.deliveryAddress.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.deliveryAddress.delete({
      where: {
        userId,
      },
    });

    res.status(200).json({
      message: "address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
