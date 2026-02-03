import jwt from "jsonwebtoken";

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".gamifygeneralsupplies.co.ke",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
