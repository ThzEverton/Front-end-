import { chromium } from 'playwright';

const FRONT = process.env.FRONT || 'http://localhost:3000';
const email = 'admin@salarosa.com';
const senha = '123456';
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

const results = [];
const consoleErrors = [];
const failedRequests = [];

function record(name, status, detail = '') {
  results.push({ name, status, detail });
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ''}`);
}

async function checkVisible(page, text, timeout = 8000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

async function visit(page, path, expectedText) {
  const response = await page.goto(`${FRONT}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  const status = response?.status();
  if (!response || status >= 400) throw new Error(`HTTP ${status || 'sem resposta'}`);
  if (expectedText) await checkVisible(page, expectedText);
  return status;
}

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

page.on('requestfailed', (req) => {
  failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
});

page.on('response', (res) => {
  const status = res.status();
  const url = res.url();
  if (status >= 500 || (status >= 400 && !url.includes('/autenticacao/usuario'))) {
    failedRequests.push(`${status} ${url}`);
  }
});

try {
  await visit(page, '/', 'Sala Rosa');
  record('Home publica carrega', 'PASS');
} catch (e) {
  record('Home publica carrega', 'FAIL', e.message);
}

try {
  await visit(page, '/login', 'Entrar na sua conta');
  record('Tela de login carrega', 'PASS');
} catch (e) {
  record('Tela de login carrega', 'FAIL', e.message);
}

try {
  await page.goto(`${FRONT}/logado/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForURL('**/login', { timeout: 10000 });
  record('Rota logada redireciona sem token', 'PASS', page.url());
} catch (e) {
  record('Rota logada redireciona sem token', 'FAIL', e.message);
}

try {
  await page.goto(`${FRONT}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"], input[type="text"]').last().fill(senha);
  await Promise.all([
    page.waitForURL('**/logado/dashboard', { timeout: 20000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await page.waitForLoadState('networkidle');
  const token = await page.evaluate(() => localStorage.getItem('sala_rosa_token'));
  if (!token) throw new Error('token nao gravado no localStorage');
  record('Login admin seed funciona', 'PASS');
} catch (e) {
  record('Login admin seed funciona', 'FAIL', e.message);
}

const loggedPages = [
  ['/logado/dashboard', 'Dashboard'],
  ['/logado/agenda', 'Agenda'],
  ['/logado/agendamentos', 'Agendamentos'],
  ['/logado/estoque', 'Estoque'],
  ['/logado/vendas', 'Vendas'],
  ['/logado/financeiro', 'Financeiro'],
  ['/logado/turmas', 'Turmas'],
  ['/logado/cadastros', 'Cadastros'],
];

for (const [path, label] of loggedPages) {
  try {
    await visit(page, path, label);
    record(`Pagina ${path} carrega`, 'PASS');
  } catch (e) {
    record(`Pagina ${path} carrega`, 'FAIL', e.message);
  }
}

try {
  await page.goto(`${FRONT}/cadastro`, { waitUntil: 'networkidle' });
  await checkVisible(page, 'Criar');
  record('Tela de cadastro carrega', 'PASS');
} catch (e) {
  record('Tela de cadastro carrega', 'FAIL', e.message);
}

try {
  await page.goto(`${FRONT}/esqueci-senha`, { waitUntil: 'networkidle' });
  await checkVisible(page, 'senha');
  record('Tela esqueci senha carrega', 'PASS');
} catch (e) {
  record('Tela esqueci senha carrega', 'FAIL', e.message);
}

const hardConsole = consoleErrors.filter((t) => !t.includes('Download the React DevTools'));
const hardRequests = [...new Set(failedRequests)].filter(
  (t) => !t.includes('/_next/static/') && !t.includes('favicon'),
);

if (hardConsole.length) record('Console sem erros', 'WARN', hardConsole.slice(0, 3).join(' | '));
else record('Console sem erros', 'PASS');

if (hardRequests.length) record('Requisicoes sem falhas relevantes', 'WARN', hardRequests.slice(0, 6).join(' | '));
else record('Requisicoes sem falhas relevantes', 'PASS');

await page.screenshot({ path: '/tmp/sala-rosa-dashboard.png', fullPage: true });
console.log(
  '\nSUMMARY_JSON ' +
    JSON.stringify(
      { results, consoleErrors: hardConsole, failedRequests: hardRequests, screenshot: '/tmp/sala-rosa-dashboard.png' },
      null,
      2,
    ),
);

await browser.close();
