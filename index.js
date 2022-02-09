const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const Axios = require('axios');
const xlsx = require('node-xlsx');
const xl = require('excel4node');

const translateCategories = {
  'Kursi Meja': 'Chair',
};

// excel setup
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('My Sheet', { properties: { defaultRowHeight: 25 } });
sheet.pageSetup.horizontalCentered = true;
sheet.pageSetup.verticalCentered = true;

const client = require('https');

// exceljs
function downloadImage(url, filepath) {
  client.get(url, (res) => {
    res.pipe(fs.createWriteStream(filepath));
  });
}
function parseImageToExcel(imagePath, index) {
  const imageId = workbook.addImage({
    filename: imagePath,
    extension: 'jpeg',
  });

  sheet.addImage(imageId, {
    tl: { col: 0, row: index + 1 },
    ext: { width: 200, height: 200 },
  });
}
function removeImages() {
  const directory = '/Users/edehe/code/furniture-business/tokopedia/images/';
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

async function parseProductsToExcel(products) {
  const cellStyles = {
    width: 32,
    style: {
      font: {
        size: 16,
      },
      alignment: { vertical: 'middle', horizontal: 'middle', wrapText: true },
    },
  };
  const linkStyle = {
    width: 32,
    style: {
      font: {
        size: 16,
        color: '#24a0ed',
      },
      alignment: { vertical: 'middle', horizontal: 'middle' },
    },
  };
  sheet.columns = [
    {
      header: 'Image',
      key: 'image',
      ...cellStyles,
    },
    { header: 'Title', key: 'title', ...cellStyles },
    { header: 'Category', key: 'category', ...cellStyles },
    { header: 'Price IDR (+15%)', key: 'price', ...cellStyles },
    { header: 'Tokopedia Page', key: 'link', ...linkStyle },
  ];

  products.forEach((product, index) => {
    const imagePath = `/Users/edehe/code/furniture-business/tokopedia/images/img${index}.jpg`;
    downloadImage(product.image, imagePath);
    parseImageToExcel(imagePath, index);

    const productPrice = Math.round(product.price.replace('Rp', '') * 1.15)
      .toString()
      .concat('.000');

    const productCategory = product.productDetails
      .find((item) => item.includes('Kategori'))
      .replace('Kategori: ', '');

    sheet.addRow({
      title: product.title,
      price: productPrice,
      category: productCategory,
      link: { text: 'Link to Tokopedia page', hyperlink: product.url },
    });
    // set row height
    const row = sheet.getRow(index + 2);
    row.height = 200;
  });

  await workbook.xlsx.writeFile('/Users/edehe/code/furniture-business/tokopedia/test.xlsx');
}

// scraper
(async () => {
  // setup
  // removeImages();
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.tokopedia.com/patihmebel'); // go to the store page
  await page.click('[data-testid="btnAknowledgeHyperlocalCoachmark"]'); // close the popup
  // page.pause();

  async function renderFullList() {
    const bottomText = page.locator('text=Jumlah produk per halaman');
    try {
      await bottomText.scrollIntoViewIfNeeded();
      await bottomText.waitFor(1000);
      await bottomText.scrollIntoViewIfNeeded();
    } catch (e) {
      console.log(e);
    }
  }
  async function iterateOverProducts() {
    await renderFullList();
    const productList = page.locator('[data-testid="linkProductName"]');
    const count = await productList.count();

    for (let i = 0; i < count; i++) {
      await renderFullList();
      const product = productList.nth(i);
      await product.waitFor('visible');
      await product.click();

      await getProductInfo();

      await page.goBack();

      // to get all the products we need to scroll
      // if (i === 9 || i === 18) {
      //   await renderFullList();
      // }
    }
  }
  async function getAllProducts() {
    const nextBtn = page.locator('[data-testid="btnShopProductPageNext"]');
    await iterateOverProducts();

    while (page.locator('[data-testid="btnShopProductPageNext"]')) {
      try {
        // await page.waitForSelector('[data-testid="btnShopProductPageNext"]', {
        //   timeout: 1000,
        // });
        await renderFullList();
        await nextBtn.click();
        await iterateOverProducts();
      } catch (e) {
        break;
      }
    }
  }

  async function getProductDetails() {
    const productInfoEl = page.locator('[data-testid="lblPDPInfoProduk"] > li');
    const productInfoCount = await productInfoEl.count();
    let productInfo = [];
    for (let i = 0; i < productInfoCount; i++) {
      const info = await productInfoEl.nth(i).textContent();
      productInfo.push(info);
    }
    return productInfo;
  }
  async function getProductInfo() {
    page.pause();
    const image = await page
      .locator('[data-testid="PDPImageMain"] > div > div > img')
      .getAttribute('src');
    const title = await page.locator('[data-testid="lblPDPDetailProductName"]').textContent();
    const price = await page.locator('[data-testid="lblPDPDetailProductPrice"]').textContent();
    const productDetails = await getProductDetails();
    const url = page.url();

    test.push({ title, price, image, productDetails, url });
  }

  let test = [];
  await getAllProducts();
  parseProductsToExcel(test);
  console.log(test);

  // page.close();
})();
