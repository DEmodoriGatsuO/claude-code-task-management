// GitHub Pages では docs/ が公開ルートになる。
// data/ は docs/ の一つ上のディレクトリにあるため、
// 相対パス '../data/' で参照する。
const DATA_BASE = '../data/';

async function loadData(filename) {
  const res = await fetch(`${DATA_BASE}${filename}`);
  if (!res.ok) throw new Error(`${filename} の取得に失敗 (HTTP ${res.status})`);
  return res.json();
}

async function main() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  try {
    // 1. インデックスを取得
    const index = await loadData('index.json');

    document.getElementById('app-title').textContent = index.title;
    document.getElementById('app-description').textContent = index.description;
    document.getElementById('updated-at').textContent = index.updatedAt ?? '—';

    // 2. 各データファイルを取得
    const datasets = await Promise.all(index.files.map(f => loadData(f)));

    // 3. UI を描画
    content.innerHTML = datasets
      .map((ds, i) => renderDataset(ds, index.files[i]))
      .join('');

    loading.hidden = true;
    content.hidden = false;

    // 4. グラフを初期化
    datasets.forEach((ds, i) => initChart(ds, index.files[i]));

  } catch (err) {
    loading.innerHTML = `
      <p class="error">⚠️ ${err.message}</p>
      <p class="error-hint">
        開発サーバーが起動しているか確認してください:<br>
        <code>docker compose up</code>
      </p>`;
    console.error(err);
  }
}

function renderDataset(data, filename) {
  const { items = [], meta = {} } = data;
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const total = items.reduce((s, i) => s + (i.value ?? 0), 0);
  const avg = items.length ? (total / items.length).toFixed(1) : '—';
  const max = items.length ? Math.max(...items.map(i => i.value ?? 0)) : '—';

  const categoryBtns = ['すべて', ...categories]
    .map(cat => `<button class="filter-btn${cat === 'すべて' ? ' filter-btn--active' : ''}" data-category="${esc(cat)}">${esc(cat)}</button>`)
    .join('');

  const rows = items
    .map(item => `
      <tr class="table__row" data-category="${esc(item.category ?? '')}">
        <td class="table__cell">${esc(item.id ?? '—')}</td>
        <td class="table__cell">${esc(item.label ?? '—')}</td>
        <td class="table__cell table__cell--num">${esc(item.value ?? '—')}</td>
        <td class="table__cell">
          <span class="badge badge--${esc(item.category ?? 'default')}">
            ${esc(item.category ?? '—')}
          </span>
        </td>
      </tr>`)
    .join('');

  return `
    <section class="dataset">
      <h2 class="dataset__title">${esc(filename)}</h2>
      <p class="dataset__meta">
        ${items.length} 件 &nbsp;|&nbsp;
        ソース: ${esc(meta.source ?? '—')}
      </p>

      <div class="summary-cards">
        <div class="card">
          <span class="card__label">件数</span>
          <span class="card__value">${items.length}</span>
        </div>
        <div class="card">
          <span class="card__label">合計値</span>
          <span class="card__value">${total}</span>
        </div>
        <div class="card">
          <span class="card__label">平均値</span>
          <span class="card__value">${avg}</span>
        </div>
        <div class="card">
          <span class="card__label">最大値</span>
          <span class="card__value">${max}</span>
        </div>
      </div>

      <div class="chart-wrapper">
        <canvas id="chart-${esc(filename)}" height="200"></canvas>
      </div>

      <div class="filter-bar">${categoryBtns}</div>

      <div class="table-wrapper">
        <table class="table" id="table-${esc(filename)}">
          <thead>
            <tr>
              <th class="table__head">ID</th>
              <th class="table__head">ラベル</th>
              <th class="table__head">値</th>
              <th class="table__head">カテゴリ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function initChart(data, filename) {
  const { items = [] } = data;
  const canvas = document.getElementById(`chart-${filename}`);
  if (!canvas || !window.Chart) return;

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const palette = ['#185fa5', '#1a8a6e', '#c4700a', '#7c3aad', '#a32d2d'];

  const colorMap = Object.fromEntries(
    categories.map((cat, i) => [cat, palette[i % palette.length]])
  );

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: items.map(i => i.label ?? String(i.id)),
      datasets: [{
        label: '値',
        data: items.map(i => i.value ?? 0),
        backgroundColor: items.map(i => (colorMap[i.category] ?? '#888') + 'cc'),
        borderColor:     items.map(i => colorMap[i.category] ?? '#888'),
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const cat = items[ctx.dataIndex]?.category;
              return cat ? `カテゴリ: ${cat}` : '';
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // カテゴリフィルター
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      const cat = btn.dataset.category;
      const tableId = `table-${filename}`;
      document.querySelectorAll(`#${tableId} .table__row`).forEach(row => {
        row.hidden = cat !== 'すべて' && row.dataset.category !== cat;
      });
    });
  });
}

function esc(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

main();
