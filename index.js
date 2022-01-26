const { chromium } = require('playwright');

(async () => {
  // setup
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.tokopedia.com/benifurniturejepara'); // go to the store page
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
      const title = await page.locator('[data-testid="lblPDPDetailProductName"]').textContent();

      test.push(title);

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

  let test = [];
  await getAllProducts();
  console.log(test);

  // page.close();
})();
