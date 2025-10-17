import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createProduct = async (req, res) => {
  const { image, name, price } = req.body;
  try {
    if (!image || !name || !price) {
      return res.status(400).json({ error: "all fields are required" });
    }

    const newProduct = await prisma.product.create({
      data: {
        image,
        name,
        price,
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
      take:limit,
      orderBy:{
        id:"desc"
      }
    })

    const totalProducts = await prisma.product.count();
    const totalPages = Math.ceil(totalProducts/limit);

    return res.status(200).json({
      currentPage:page,
      totalPages,
      totalProducts,
      products,
    })
  } catch (error) {
    res.status(500).json({error:error.message})
  }
};

export const getFirstThreeProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSingleProduct = async (req, res) => {
  const id = parseInt(req.params.id);
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

export const updateProduct = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, image, price } = req.body;
  try {
    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        image,
        price,
      },
    });

    res.status(201).json({ updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSingleProduct = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const deletedProduct = await prisma.product.delete({
      where: {
        id,
      },
    });
    res.status(200).json({ message: "product deleted succesfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
