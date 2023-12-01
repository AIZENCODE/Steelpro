import puppeteer from "puppeteer";
import { join, dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import userPrefs from "puppeteer-extra-plugin-user-preferences";
import puppeteerExtra from "puppeteer-extra";
import fetch from "node-fetch";

export async function fichas() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const productsInformation = [];

  const currentFileURL = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileURL);
  const currentDirPath = dirname(currentFilePath);
  const __dirname = join(currentDirPath, "..", "public", "pdfs");

  try {
    await page.goto("https://www.steelproperu.com/", {
      waitUntil: "domcontentloaded",
    });
    await page.setViewport({ width: 1920, height: 1080 }); // Establecer el tamaño de la ventana
    await page.waitForSelector("#select_product_lines");
    // Hacer clic en el select
    await page.click("#select_product_lines");

    // Esperar a que aparezcan los elementos de la lista desplegable
    await page.waitForSelector("#select_product_lines option:nth-child(2)");

    // Seleccionar el segundo elemento de la lista desplegable por su índice
    await page.select("#select_product_lines", "Auditiva");

    // Esperar a que el elemento de búsqueda esté disponible
    await page.evaluate(() => {
      const select = document.querySelector("#select_product_lines");
      const options = select.querySelectorAll("option");
      options[12].selected = true;
      select.dispatchEvent(new Event("change"));
    });

    // Hacer clic en el botón de búsqueda
    await page.click(".btn-search");

    await page.waitForSelector("#container_products_results");

    const allProductLinks = [];
    await page.waitForTimeout(40000);
    const enlaces = await page.evaluate(() => {
      const links = [];
      const elements = document.querySelectorAll(
        "#container_products_results a"
      );

      for (let element of elements) {
        links.push(element.href);
      }

      return links;
    });
    allProductLinks.push(...enlaces);
    console.log(allProductLinks);
    // Obtener información detallada de cada producto
    let count = 1;
    for (let link of allProductLinks) {
      await page.goto(link, { waitUntil: "networkidle2" });
      await page.waitForSelector("#product_name");

      const productInfo = await page.evaluate(() => {
        const tmp = {};

        tmp.title = document.querySelector("#product_name").innerText.trim();
        const productDescriptionElement = document.querySelector(
          "#product_description "
        );

        if (productDescriptionElement) {
          tmp.description = productDescriptionElement.innerText.trim();
        }
        tmp.pageURL = window.location.href;
        tmp.image =
          document.querySelector("#imagenunica").getAttribute("src") ||
          document.querySelector("#imagenunica").getAttribute("data-src");
        tmp.pdf = document
          .querySelector("#documentosBotones .btn-steel-g")
          .getAttribute("href");

        return tmp;
      });

      puppeteerExtra.use(
        userPrefs({
          preferences: {
            download: {
              prompt_for_download: true,
              open_pdf_in_system_reader: true,
            },
            plugins: {
              always_open_pdf_externally: true,
            },
          },
        })
      );

      await page.goto(productInfo.pdf);
      // Obtener la URL actual
      const currentUrl = page.url();

      // Si la URL actual es la del PDF, descargarlo usando fetch
      if (currentUrl.endsWith(".pdf")) {
        const response = await fetch(currentUrl);
        const arrayBuffer = await response.arrayBuffer();0
        const buffer = await Buffer.from(arrayBuffer);

        // Guardar el PDF en el sistema de archivos
        fs.writeFileSync(__dirname+productInfo.title+".pdf", buffer);
      }
      //   await page.waitForTimeout(3000);
      //   const pdfOptions = {
      //     path: __dirname+"auditivo"+productInfo.title+".pdf", // Ruta donde deseas guardar el archivo PDF
      //     format: 'A4',

      //   };

      //   await page.pdf(pdfOptions);
      //   // Descargar y guardar la imagen del producto (sin procesar)
      //   const imageLink = productInfo.image;
      //   const response = await page.goto(imageLink, {
      //     waitUntil: "networkidle2",
      //   });
      //   const buffer = await response.buffer();

      //   const imageName = `${productInfo.title
      //     .replace(/[^\w\s]/gi, "")
      //     .substring(0, 100)}.jpg`;
      //   const imagePath = join(__dirname, "auditivo", imageName);

      //   writeFileSync(imagePath, buffer);

      productInfo.id = count;
      //   productInfo.imagePath = imageName;

      // Agregar información adicional al objeto del producto
      productInfo.id = count;
      // productInfo.imagePath = imagePath;
      count++;

      productsInformation.push(productInfo);
    }
  } catch (error) {
    console.error("Error durante el scraping:", error);
  } finally {
    await browser.close();
  }
}
