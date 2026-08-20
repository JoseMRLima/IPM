// src/utils/export.js
// Utilitários simples para exportar dados em CSV e JSON (client-side)

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// JSON
export function exportToJSON(data, filename = "dados.json") {
  const blob = new Blob([JSON.stringify(data ?? [], null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(filename, blob);
}

// CSV
function toCSVValue(v) {
  const s = (v ?? "").toString().replace(/"/g, '""');
  return `"${s}"`;
}

export function exportToCSV(rows, filename = "dados.csv") {
  const arr = Array.isArray(rows) ? rows : [];

  if (!arr.length) {
    downloadBlob(filename, new Blob([""], { type: "text/csv;charset=utf-8" }));
    return;
  }

  // União de chaves (para não falhar com objetos "diferentes")
  const headers = Array.from(new Set(arr.flatMap((r) => Object.keys(r || {}))));

  const lines = [
    headers.join(","),
    ...arr.map((r) => headers.map((h) => toCSVValue(r?.[h])).join(",")),
  ];

  downloadBlob(
    filename,
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  );
}

export function chartDataToRows(chartData) {
  if (!chartData || !Array.isArray(chartData.labels) || !Array.isArray(chartData.datasets)) return [];
  const labels = chartData.labels;
  const series = chartData.datasets.map(d => ({ name: d.label ?? "serie", data: d.data ?? [] }));

  return labels.map((lab, i) => {
    const row = { label: lab };
    for (const s of series) row[s.name] = s.data[i] ?? "";
    return row;
  });
}
