import puppeteer from 'puppeteer';
import fs from 'node:fs';


const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://arbitrum.questbook.app/dashboard/?role=community&grantId=671a105a2047c84bb8a73770&chainId=10');
 
  await page.waitForSelector('div > [proposal]');
  await page.waitForNetworkIdle();
  const locator = await page.locator('div > [proposal]:last-child');
  locator.setEnsureElementIsInTheViewport(true);
  await page.waitForNetworkIdle();
  
  
  const finalScraping = [];

  const proposalsList = await page.evaluate(() => {
    // document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
    const proposals = Array.from(document.querySelectorAll('div > [proposal]'));
    let i = 0;

    return proposals.map(proposal => {
      i++;
      const [ title, date, author ] = Array.from(proposal.querySelectorAll('p')).map(p => p.innerText);
      return { title, date, author, i };
    });
  });

  for (const proposal of proposalsList) {
    await Promise.all([
      page.waitForNetworkIdle(),
      page.click(`div > [proposal]:nth-child(${proposal.i})`),
    ]);
    console.log(page.url(), 'after');
    console.log(proposal.i);
    const { proposalText, milestonesText } = await page.evaluate(() => {
      const proposalText = document.querySelector('.body > div > div > div > div:nth-child(2)').textContent;
      const milestonesText = document.querySelector('.body > div > div > div > div:nth-child(3)').textContent;

      return { proposalText, milestonesText };
    });

    finalScraping.push({ ...proposal, proposalText, milestonesText });
  }
  

  fs.writeFileSync('scraping.json', JSON.stringify(finalScraping, null, 2));

  // current page
  /* const currentProposalText = await page.evaluate(() => {
    const proposalText = document.querySelector('.body > div > div > div > div:nth-child(2)').innerHTML;
    const milestonesText = document.querySelector('.body > div > div > div > div:nth-child(3)').innerHTML;

    return { proposalText, milestonesText };
  });
  console.log(currentProposalText);
 */

  await browser.close();
};

(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
  }
})();
