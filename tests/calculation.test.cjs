const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('KAMIDA_事業計画ツール.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ncalc\(\);\s*$/, '');
function calculate(values = {}, actuals = {}) {
  const inputs = { price: 100000, rate: 10, units: 10, mGrowth: 0, months: 12,
    labor: 50000, travel: 0, mktg: 0, other: 0, init: 0,
    startMonth: '2026-01', taxRate: 30, depreciation: 0, viewYear: '全期間', ...values };
  const nodes = new Map();
  const document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { value: String(inputs[id] ?? ''), textContent: '', innerHTML: '' });
    return nodes.get(id);
  }};
  const context = vm.createContext({ document, localStorage: { getItem: () => JSON.stringify(actuals) }, console });
  vm.runInContext(script, context);
  context.renderDashboard = (months, perUnitIncome, monthlyFixed, bep, cumNet) => {
    context.result = { months, perUnitIncome, monthlyFixed, bep, cumNet };
  };
  context.calc();
  return { ...context.result, nodes };
}

test('zero revenue remains a finite loss without tax or a break-even quantity', () => {
  const r = calculate({ price: 0 }, { '2026-01': 3 });
  assert.equal(r.bep, '—');
  assert.equal(r.cumNet, -600000);
  assert.equal(r.months[0].income, 0);
  for (const node of r.nodes.values()) assert.doesNotMatch(node.innerHTML, /NaN|Infinity/);
});

test('negative pre-tax income has no tax charge', () => {
  const r = calculate({ units: 1, depreciation: 120000 });
  assert.equal(r.cumNet, -600000);
});

test('tax applies only after annual depreciation', () => {
  const r = calculate({ depreciation: 120000 });
  assert.equal(r.cumNet, (600000 - 120000) * 0.7);
});

test('initial investment is included only in the first month', () => {
  const r = calculate({ init: 300000, taxRate: 0 });
  assert.equal(r.months[0].cost, 350000);
  assert.equal(r.months[1].cost, 50000);
  assert.equal(r.months.reduce((total, m) => total + m.cost, 0), 900000);
  assert.equal(r.cumNet, 300000);
});

test('the period crosses calendar years and clamps to the supported range', () => {
  const short = calculate({ startMonth: '2026-12', months: 0, taxRate: 0 });
  assert.equal(short.months.length, 3);
  assert.equal(short.months[1].year, 2027);
  assert.equal(short.months[1].month, 1);
  assert.equal(calculate({ months: 1000 }).months.length, 60);
});

test('100 percent tax eliminates only positive pre-tax profit', () => {
  assert.equal(calculate({ taxRate: 100 }).cumNet, 0);
  assert.equal(calculate({ taxRate: 100, price: 0 }).cumNet, -600000);
});

test('zero actual sales are recorded as zero instead of missing data', () => {
  const r = calculate({}, { '2026-01': 0 });
  assert.match(r.nodes.get('monthlyFoot').innerHTML, /<td>0<\/td>/);
  assert.match(r.nodes.get('monthlyFoot').innerHTML, />0%<\/td>/);
});

test('missing actual sales remain missing in the total row', () => {
  const row = calculate().nodes.get('monthlyFoot').innerHTML;
  assert.equal((row.match(/>—<\/td>/g) || []).length, 4);
});
