import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createAddress = async (req, res) => {
  const userId = req.user.id;
  const { companyName, street, floorNumber, city, postalCode, phoneNumber } =
    req.body;

  try {
    if (!companyName || !street || !postalCode) {
      return res.status(400).json({
        message: "companyName, street and postalCode are required",
      });
    }

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
        companyName: companyName.trim(),
        street: street.trim(),
        floorNumber: floorNumber?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        userId,
      },
    });

    res.status(201).json({ newAddress });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: "Failed to create address",
    });
  }
};

export const updateAddress = async (req, res) => {
  const { companyName, street, floorNumber, city, postalCode, phoneNumber } =
    req.body;
  const userId = req.user.id;

  try {
    const existing = await prisma.deliveryAddress.findUnique({
      where: { userId },
    });

    if (!existing)
      return res.status(404).json({ message: "Address not found" });

    const updatedAddress = await prisma.deliveryAddress.update({
      where: { userId },
      data: {
        companyName: companyName?.trim() ?? existing.companyName,
        street: street?.trim() ?? existing.street,
        floorNumber: floorNumber?.trim() ?? existing.floorNumber,
        city: city?.trim() ?? existing.city,
        postalCode: postalCode?.trim() ?? existing.postalCode,
        phoneNumber: phoneNumber?.trim() ?? existing.phoneNumber,
      },
    });

    res.status(200).json({ updatedAddress });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      message: "Failed to update address",
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
    console.error(error.message);
    return res.status(500).json({
      message: "Failed to fetch address",
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
    console.error(error.message);
    res.status(500).json({
      message: "Failed to delete address",
    });
  }
};
