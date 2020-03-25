const puppeteer = require('puppeteer');
const Fs = require('fs-extra')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, likeGecko) Chrome/41.0.2228.0 Safari/537.36';
const COVID19_TOKYO_URL = 'https://www.bousai.metro.tokyo.lg.jp/taisaku/saigai/1007261/index.html';

async function fetchCovid19RelatedHeadLineAndURL(page) {
    await page.setUserAgent(USER_AGENT);
    await page.goto(COVID19_TOKYO_URL);
    await page.waitFor(3000);
    const data = await page.evaluate(() => {
        return Array.from(document.querySelector('dl.linkdate').querySelectorAll('ul.objectlink')).filter((e) => {
            return e.querySelector('a').textContent.includes('新型コロナウイルスに関連した患者の発生について')
        }).map((e) => {
            return {title: e.textContent.replace(/(\r\n|\n|\r)/gm, ""), url: e.querySelector('a').href}
        })

    });
    return data;
}

async function validatePage(page) {
    try {
        const header = await page.evaluate(() => {
            return Array.from(Array.from(document.querySelectorAll('div#voice > table tr')).filter((e, idx) => {
                return idx == 0
            }).map((e) => {
                return e.querySelectorAll('th')
            })[0]).slice(-1)[0].textContent
        });

        return header === "備　考"
    } catch (e) {
        return false;
    }

}

async function fetchPatientsRecord(page, url) {
    await page.goto(url);
    const isValidPage = await validatePage(page);
    if (!isValidPage) {
        await page.waitFor(500);
        return;
    }
    await page.waitFor(3000);
    const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div#voice > table tr')).filter((e, idx) => {
            return idx != 0
        }).map((e) => {
            return Array.from(e.querySelectorAll('td')).map((e) => {
                return e.textContent
            })
        }).map((e) => {
            const pid = e[0];
            return {
                pid: parseInt(pid),
                age_group: e[1],
                gender: e[2],
                address: e[3],
                job_pattern: e[4],
                symptom: e[5],
                date: e[6],
                note: e[7].split('\n').map((e, idx) => {
                    return {pid: pid, hid: `${pid}-${idx}`, body: e}
                }),
                raw_note: e[7]
            }
        });
    });
    return data;


}

async function writeToFile (path, data) {
    const json = JSON.stringify(data, null, 2)

    try {
        await Fs.writeFile(path, json)
        console.log('Saved data to file.')
    } catch (error) {
        console.error(error)
    }
}

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    const headlines = await fetchCovid19RelatedHeadLineAndURL(page);

    let data = []
    for (let headline of headlines) {
        console.log(headline);
        const records = await fetchPatientsRecord(page, headline.url);
        if (records === undefined) {
            continue;
        }
        console.log(records)
        data = data.concat(records);
    }
    await browser.close();

    console.log(data)
    await writeToFile('data.json', data)

})()
