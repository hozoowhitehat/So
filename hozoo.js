const puppeteer = require('puppeteer');
const readline = require('readline');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await new Promise(resolve => rl.question('Press Enter after scanning QR code and entering the group: ', resolve));

    let banConfirmation = true;

    async function getLastMessage() {
        const lastMessage = await page.$$('._3zb-j');
        const spanMessage = await lastMessage[lastMessage.length - 1].$$('span');
        return await page.evaluate(span => span.innerText, spanMessage[0]);
    }

    async function sendMessage(message) {
        const messageInput = await page.$('._1Plpp');
        await messageInput.type(message);
        const sendButton = await page.$$('.weEq5');
        await sendButton[1].click();
    }

    async function removePerson(message) {
        await sendMessage(`*REMOVING ${message} FOR EVER*`);
        const topHeader = await page.$('._2y17h');
        await topHeader.click();

        const memberQuantid = await page.$$('._1sYdX');
        const memberText = await page.evaluate(el => el.innerText, memberQuantid[2]);
        const memberCount = parseInt(memberText.replace('participants', '').replace(' ', ''));

        if (memberCount >= 11) {
            const arrowDiv = await page.$$('._1jJLh');
            await arrowDiv[2].click();
        }

        const principalDivUser = await page.$$('._3xj48');
        for (let i = 2; i < principalDivUser.length; i++) {
            const divUser = await principalDivUser[i].$$('._3j7s9');
            const divUserNameContainer = await divUser[0].$$('._2FBdJ');
            const divUserName = await divUserNameContainer[0].$$('._25Ooe');
            const spanUserNameContainer = await divUserName[0].$$('._3TEwt');
            const spanUserName = await spanUserNameContainer[0].$$('._1wjpf');
            const name = await page.evaluate(el => el.innerText, spanUserName[0]);

            if (name.toLowerCase() === message.toLowerCase()) {
                await page.evaluate(el => el.scrollIntoView(), spanUserName[0]);
                const iconForOpenBanModal = await page.$('.ZR5SB');
                await iconForOpenBanModal.click();

                const modalBtns = await page.$$('.Pm0Ov');
                for (let j = 0; j < modalBtns.length; j++) {
                    const banBtn = await page.evaluate(el => el.innerText, modalBtns[j]);
                    if (banBtn === 'Remove') {
                        await modalBtns[j].click();
                        const removeBtn = await page.$('.PNlAR');
                        await removeBtn.click();
                        const closeBanBtn = await page.$('._1aTxu');
                        await closeBanBtn.click();
                        return;
                    }
                }
            }
        }
    }

    while (true) {
        const message = await getLastMessage();
        if (message.toLowerCase() === '/help') {
            await sendMessage('*Comands list:*\n1- /Rules\n2- /Ban @\'name_of_the_contact/number\'\n3- /Ban confirmation   (to disable or enable ban for other members)\nSecret...');
        } else if (message.toLowerCase().startsWith('/ban') && message.toLowerCase() !== '/ban confirmation') {
            const userName = message.toLowerCase().replace('/ban', '').replace('@', '').trim();
            if (banConfirmation) {
                const confirmation = await new Promise(resolve => rl.question('Want to remove someone? Y/N: ', resolve));
                if (confirmation.toLowerCase() === 'y') {
                    await removePerson(userName);
                } else {
                    await sendMessage('ERROR... permission denied');
                }
            } else {
                await removePerson(userName);
            }
        } else if (message.toLowerCase() === '/ban confirmation') {
            const parent = await page.evaluateHandle(el => el.closest('.message-out'), await page.$$('._3zb-j')[0]);
            if (parent) {
                if (banConfirmation) {
                    banConfirmation = false;
                    await sendMessage('Ban confirmation disabled!');
                } else {
                    banConfirmation = true;
                    await sendMessage('Ban confirmation enabled!');
                }
            } else {
                await sendMessage('Error... Just the admin can do this!');
            }
        } else if (message.startsWith('/')) {
            await sendMessage('*I don\'t understand*\nType /help to see the command list...');
        }
    }
})();
