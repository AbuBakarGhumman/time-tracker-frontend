import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    try {
        await page.goto('http://localhost:5173/time-tracker-frontend/', { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (e) { } // ignore timeout

    await new Promise(r => setTimeout(r, 2000));
    const content = await page.evaluate(() => document.body.innerText);

    if (content.trim() === '') {
        console.log("PAGE IS EMPTY");
    } else {
        console.log("SUCCESS! PAGE CONTENT:", content.substring(0, 50).replace(/\n/g, ' '));
    }
    await browser.close();
})();
