async page => {
  const origin = 'http://127.0.0.1:5195';
  const themes = ['clear', 'folio', 'studio', 'canvas', 'native', 'mono'];
  const report = [];
  const external = [];
  await page.context().route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(origin)) { external.push(url); return route.abort(); }
    return route.continue();
  });
  for (const theme of themes) {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto(`${origin}/?theme=${theme}`);
    await page.waitForTimeout(120);
    await page.getByRole('button', { name: /工程项目/ }).last().click();
    await page.getByRole('region', { name: '工程模式项目入口' }).waitFor();
    const project = await page.evaluate(() => {
      const region = document.querySelector('[aria-label="工程模式项目入口"]');
      const command = region?.querySelector('.project-command');
      const box = region?.getBoundingClientRect();
      return { visible: !!region, commandDefaultClosed: command ? !command.open : false, width: box?.width || 0, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    if (!project.visible || project.horizontalOverflow || project.width < 600) throw new Error(JSON.stringify({ theme, project }));
    await page.locator('.project-command summary').click();
    if (!(await page.locator('.project-command').evaluate(el => el.open))) throw new Error(`Command disclosure did not open for ${theme}`);
    await page.getByRole('button', { name: '回到对话' }).click();
    if (theme !== 'mono') {
      await page.getByRole('button', { name: 'GPT-6' }).click();
      await page.getByRole('button', { name: 'GPT Work', exact: true }).click();
      await page.getByRole('button', { name: /Claude Sonnet/ }).click();
      await page.getByRole('button', { name: '思考 · 标准', exact: true }).click();
      await page.getByRole('button', { name: '尽全力', exact: true }).click();
      await page.getByRole('button', { name: '打开设置', exact: true }).click();
      await page.locator('.settings-panel').waitFor();
      await page.getByRole('button', { name: '关闭设置' }).click();
    }
    report.push({ theme, project, passed: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/?theme=clear`);
  await page.getByRole('button', { name: /工程项目/ }).last().click();
  const mobile = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, width: document.querySelector('.project-screen')?.getBoundingClientRect().width || 0 }));
  if (mobile.overflow || mobile.width > 391) throw new Error(JSON.stringify({ mobile }));
  await page.context().unroute('**/*');
  return { passed: true, themes: report, mobile, externalRequests: external };
}
