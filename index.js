const { chromium } = require('playwright');

(async () => {
  // setup
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
      const product = productList.nth(i);
      await product.waitFor('visible');
      await product.click();

      await getProductInfo();

      await page.goBack();

      // to get all the products we need to scroll
      if (i === 9 || i === 18) {
        await renderFullList();
      }
    }
  }
  async function getAllProducts() {
    // page.pause();
    await iterateOverProducts();

    while (page.locator('[data-testid="btnShopProductPageNext"]')) {
      try {
        await page.waitForSelector('[data-testid="btnShopProductPageNext"]', {
          timeout: 1000,
        });
        await nextBtn.click();
        await iterateOverProducts();
      } catch (e) {
        break;
      }
    }
  }
  // TODO getImages function
  async function getImages() {
    const imageList = page.locator('[data-testid="PDPImageThumbnail"] > div > img');
    // #pdp_comp-product_media > div > div.css-1k04i9x > div > div > div.css-1aplawl.active > div > img
    const count = await imageList.count();

    let images = [];
    for (let i = 0; i < count; i++) {
      const image = await imageList.nth(i).getAttribute('src');

      await image.waitFor('visible');

      // await image.hover();

      images.push(image);
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

    test.push({ title, price, image, productDetails });
  }

  let test = [];
  await getAllProducts();
  console.log(test);

  // page.close();
})();
