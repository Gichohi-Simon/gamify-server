import { PrismaClient } from "@prisma/client";
import cloudinary from "../utils/cloudinaryConfig.js";
import fs from "fs";

const prisma = new PrismaClient();

export const createProduct = async (req, res) => {
  const { name, price, description, category } = req.body;

  try {
    let images = [];
    let cloudinary_ids = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "products",
          resource_type: "image",
        });

        images.push(uploadResult.secure_url);
        cloudinary_ids.push(uploadResult.public_id);

        fs.unlinkSync(file.path);
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        category,
        images,
        cloudinary_ids: cloudinary_ids,
      },
    });

    res.status(201).json({ newProduct });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "failed to create product" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 8, q = "" } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const skip = (pageNum - 1) * limitNum;
    const filters = { isActive: true };

    if (q.trim()) {
      filters.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    res.status(200).json({
      success: true,
      currentPage: pageNum,
      totalPages,
      totalProducts,
      products,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "failed to get all products" });
  }
};

export const getFirstFourProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      take: 4,
      orderBy: {
        id: "desc",
      },
    });
    res.status(200).json({ products });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "failed to get first four products" });
  }
};

export const getRandomFourProducts = async (req, res) => {
  try {
    const allProducts = await prisma.product.findMany();

    for (let i = allProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
    }

    const products = allProducts.slice(0, 4);

    res.status(200).json({ products });
  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: "failed to get random four products" });
  }
};

export const getSingleProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const singleProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    res.status(200).json({ singleProduct });
  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: "failed to get single product" });
  }
};

export const getProductsByIds = async (req, res) => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: "failed to get a single product" });
  }
};

export const updateProduct = async (req, res) => {
  const id = req.params.id;
  const { name, price, description, category, removeImages } = req.body;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });
    if (!existing)
      return res.status(404).json({ message: "Product not found" });

    let removeList = [];
    if (removeImages) {
      try {
        removeList = JSON.parse(removeImages);
      } catch {
        removeList = [removeImages];
      }
    }

    let updatedImages = existing.images || [];
    let updatedCloudIds = [...existing.cloudinary_ids];

    if (removeList.length > 0) {
      for (const publicId of removeList) {
        await cloudinary.uploader.destroy(publicId);
        const index = updatedCloudIds.indexOf(publicId);
        if (index > -1) {
          updatedCloudIds.splice(index, 1);
          updatedImages.splice(index, 1);
        }
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        updatedImages.push(upload.secure_url);
        updatedCloudIds.push(upload.public_id);
        fs.unlinkSync(file.path);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: Number(price),
        description,
        category,
        images: updatedImages,
        cloudinary_ids: updatedCloudIds,
      },
    });

    res.status(200).json({ updatedProduct });
  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: "failed to get random four products" });
  }
};

export const deleteSingleProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.product.update({
      where: {
        id,
      },
      data: { isActive: false },
    });
    res.status(200).json({ message: "failed to update product" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTotalProducts = async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();
    res.status(200).json({ totalProducts });
  } catch (error) {
    console.error(error.message);
    res.status(200).json({ message: "failed to get total products" });
  }
};
