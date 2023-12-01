import { Router } from "express";
import { fichas } from "../../src/controller/fichas.js";

const router = Router();

// Ruta para la página de inicio
router.get("/", (req, res) => res.render("index", { title: "Inicio" }));

// Ruta para la página "About"
router.post("/descarga", async (req, res) => {
  try {
    const productsInformation = await fichas();
    res.render("index", { title: "busqueda" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Otras rutas o manejo de errores pueden ir aquí...

export default router;
