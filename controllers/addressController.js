import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createAddress = async (req, res) => {
  const userId = req.user.id;
  const { companyName, street, floorNumber, city, postalCode, phoneNumber } =
    req.body;

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
        phoneNumber,
        userId,
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
  const { companyName, street, floorNumber, city, postalCode, phoneNumber } =
    req.body;
  const userId = req.user.id;

  try {
    const address = await prisma.deliveryAddress.findUnique({
      where: { userId },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const updateData = {};

    if (companyName !== undefined) updateData.companyName = companyName;
    if (street !== undefined) updateData.street = street;
    if (floorNumber !== undefined) updateData.floorNumber = floorNumber;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    const updatedAddress = await prisma.deliveryAddress.update({
      where: { userId },
      data: updateData,
    });

    return res.status(200).json({ updatedAddress });
  } catch (error) {
    return res.status(500).json({
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
