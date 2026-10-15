/** Whole-site production audit. Run after build/start; never sends money or messages. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const base = process.env.BM_BASE_URL || 'http://127.0.0.1:3130';
const output = process.env.BM_AUDIT_OUTPUT || 'docs/site-audit';
const routes = ['/', '/about', '/construction', '/support', '/updates', '/transparency', '/contact', '/privacy', '/donation-policy'];
const viewports = [{width:320,height:700},{width:390,height:844},{width:568,height:320},{width:768,height:900},{width:1024,height:900},{width:1440,height:900}];
// The form fixture is intentionally unreachable: audit UI without touching real data.
const server = process.env.BM_BASE_URL ? null : spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3130'], {
  env:{...process.env,DATABASE_URL:'mysql://visual_only@127.0.0.1:1/unavailable',APP_ORIGIN:base,CSRF_SECRET:'audit-only-not-production-0000000000000000'},
  stdio:['ignore','ignore','inherit'],
});
const serverClosed = server ? once(server,'exit') : null;
for(let attempt=0;attempt<100;attempt++) {
  try { if((await fetch(base)).ok) break; } catch {}
  if(attempt===99) throw new Error('Production audit server unavailable');
  await new Promise(r=>setTimeout(r,200));
}
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BM_CHROME_PATH ? { executablePath: process.env.BM_CHROME_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
fs.mkdirSync(output, {recursive:true});
const report = { routes:[], interactions:[], links:[], errors:[] };
const links = new Set();
try {
  for (const locale of ['bn','en']) {
    const context = await browser.newContext({ viewport:viewports[0], reducedMotion:'reduce' });
    await context.addCookies([{name:'bm-locale',value:locale,url:base}]);
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(`${locale}: ${e.message}`));
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const route of routes) {
        const response = await page.goto(base+route, {waitUntil:'networkidle'});
        assert.equal(response.status(),200,route);
        await page.locator('main h1').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate(() => {
          const doc=document.documentElement;
          const controls=[...document.querySelectorAll('body > header button, body > header a')].filter(e=>e.getBoundingClientRect().width);
          const text=document.querySelector('main').innerText;
          return {
            lang:doc.lang,h1:document.querySelectorAll('main h1').length,title:document.title,
            width:doc.clientWidth,scrollWidth:doc.scrollWidth,
            clippedControls:controls.filter(e=>{const b=e.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(e=>e.textContent.trim()),
            brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),
            missingAlts:[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.src),
            hrefs:[...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')),
            stalePrivacy:/No personal-data collection feature is active|ব্যক্তিগত তথ্য সংগ্রহের কোনো ব্যবস্থা চালু নেই/.test(text),
            unsafeDestination:/1145000492524|01716-892875|01716892875/.test(text),
            placeholder:/Lorem ipsum|TODO|Coming soon|পরবর্তী ধাপে তৈরি হবে/.test(text),
            logo:document.querySelector('body > header svg[role="img"]')?.getBoundingClientRect().toJSON(),
          };
        });
        report.routes.push({route,locale,viewport,...state,hrefs:undefined});
        if(route==='/donation-policy') console.log(`Checked ${locale} ${viewport.width}x${viewport.height}`);
        for(const href of state.hrefs)if(href?.startsWith('/'))links.add(href.split('#')[0]);
        assert.equal(state.lang,locale);assert.equal(state.h1,1);
        assert.ok(state.scrollWidth<=state.width+1,`overflow ${locale} ${route} ${viewport.width}`);
        assert.deepEqual(state.clippedControls,[],`clipped header ${route}`);
        assert.deepEqual(state.brokenImages,[],`broken images ${route}`);assert.deepEqual(state.missingAlts,[]);
        assert.equal(state.unsafeDestination,false);assert.equal(state.placeholder,false);assert.equal(state.stalePrivacy,false);
        assert.ok(state.logo?.width>=48,'Visible logo');
        if ((viewport.width===390&&['/','/support','/privacy'].includes(route)) || (viewport.width===1440&&route==='/')) {
          await page.screenshot({path:path.join(output,`${locale}-${route==='/'?'home':route.slice(1)}-${viewport.width}.png`),fullPage:true});
        }
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/support',{waitUntil:'networkidle'});
    const copyNumber=page.getByRole('button',{name:locale==='bn'?'নম্বর কপি করুন':'Copy number',exact:true});
    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:base});
    await copyNumber.click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'01913331811');
    report.interactions.push(`${locale}: exact bKash clipboard`);
    const menu=page.locator('body > header button[aria-expanded]');
    await menu.focus();await page.keyboard.press('Enter');assert.equal(await menu.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
    assert.ok(await menu.evaluate(e=>document.activeElement===e));
    report.interactions.push(`${locale}: keyboard menu, Escape and focus restoration`);
    await page.goto(base+'/updates',{waitUntil:'networkidle'});
    await page.locator('main button').first().click();
    await page.getByRole('dialog').waitFor();await page.keyboard.press('ArrowRight');
    await page.setViewportSize({width:568,height:320});
    const dialogBounds=await page.getByRole('dialog').evaluate(dialog=>({
      controls:[...dialog.querySelectorAll('button')].map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent.trim(),top:b.top,bottom:b.bottom};}),height:innerHeight,
    }));
    assert.ok(dialogBounds.controls.every(b=>b.top>=0&&b.bottom<=dialogBounds.height),JSON.stringify(dialogBounds));
    await page.screenshot({path:path.join(output,`${locale}-gallery-landscape.png`)});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
    report.interactions.push(`${locale}: gallery open, arrow navigation, landscape controls and Escape`);
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/support',{waitUntil:'networkidle'});
    if(await page.locator('#dr-amount').count()) {
      await page.getByRole('button',{name:locale==='bn'?'তথ্য জমা দিন':'Submit details',exact:true}).click();
      await page.locator('#dr-amount-error').waitFor();
      assert.ok(await page.locator('#dr-amount').evaluate(e=>document.activeElement===e));
      const toggle=page.getByRole('button',{name:locale==='bn'?'আরও তথ্য দিন—ঐচ্ছিক':'Add more details — optional',exact:true});
      await toggle.click();await page.locator('#dr-name').waitFor();await toggle.click();assert.equal(await page.locator('#dr-name').count(),0);
      report.interactions.push(`${locale}: client validation, inline errors, focus and optional fields`);
      await page.locator('#dr-amount').fill('১০০');
      await page.locator('#dr-trx').fill('UI-AUDIT-NOT-A-PAYMENT');
      await page.locator('#dr-date').fill('2026-01-01');
      // Only the script's deliberately unreachable local fixture may test a valid submission.
      if(server) {
        await page.getByRole('button',{name:locale==='bn'?'তথ্য জমা দিন':'Submit details',exact:true}).click();
        await page.getByRole('alert').filter({hasText:locale==='bn'?'সংরক্ষণ':'save'}).waitFor();
        assert.equal(await page.locator('#dr-amount').inputValue(),'১০০');
        report.interactions.push(`${locale}: unavailable database preserves entered information`);
      }
      assert.equal(await page.locator('a[href="#donation-options"]').count(),1);
    }
    // Actual language switch while preserving the page URL.
    await page.getByRole('button',{name:locale==='bn'?'English':'বাংলা',exact:true}).click();
    await page.waitForFunction(lang=>document.documentElement.lang===lang,locale==='bn'?'en':'bn');
    assert.equal(new URL(page.url()).pathname,'/support');
    report.interactions.push(`${locale}: language switch preserves page`);
    await context.close();
  }
  const request=await browser.newContext();
  for(const href of links){const res=await request.request.get(base+href);report.links.push({href,status:res.status()});assert.equal(res.status(),200);}
  const icon=await request.request.get(base+'/icon.svg');assert.equal(icon.status(),200);assert.match(await icon.text(),/Baitul Mamur/);
  await request.close();assert.deepEqual(report.errors,[]);
  console.log(JSON.stringify({renderChecks:report.routes.length,interactions:report.interactions.length,internalLinks:report.links.length,errors:report.errors},null,2));
} finally {
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
  await browser.close();
  if(server){ server.kill("SIGTERM"); await serverClosed; }
}
