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
    res.status(500).json({ error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// http://localhost:8080/product?page=1
export const getPaginatedProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  // calcluates number of products to skip
  const skip = (page - 1) * limit;
  try {
    const products = await prisma.product.findMany({
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
    });

    const totalProducts = await prisma.product.count();
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts,
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

export const getRandomFourProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      take: 4,
      orderBy: { random: true },
    });

    res.status(200).json({ products });
  } catch (error) {
    res.status(200).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// http://localhost:8080/product/search?q=book
export const searchProducts = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
    });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductsByIds = async (req, res) => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam) {
      return res.status(400).json({ error: "No product IDs provided" });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return res.status(400).json({ error: "Invalid product IDs" });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const id = req.params.id;
  const { name, price, description, category, removeImages } = req.body;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });
    if (!existing) return res.status(404).json({ error: "Product not found" });

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
    res.status(500).json({ error: error.message });
  }
};

export const deleteSingleProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.product.delete({
      where: {
        id,
      },
    });
    res.status(200).json({ message: "product deleted succesfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
