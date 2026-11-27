import assert from "node:assert/strict";

export function teksHalaman(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Shape shared by the C-009 and C-010 UI verifiers.
export function buatVerifikasiUi(baseUrl) {
  async function ambil(cookie, path) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { cookie },
      redirect: "manual",
    });
    const body = await res.text();
    return { status: res.status, html: body, teks: teksHalaman(body) };
  }

  async function harusMemuat(cookie, path, potongan, label) {
    const hasil = await ambil(cookie, path);
    assert.equal(hasil.status, 200, `${label}: HTTP ${hasil.status}`);
    for (const teks of potongan) {
      assert.ok(
        hasil.teks.includes(teks),
        `${label}: tidak menemukan teks "${teks}"`,
      );
    }
    return hasil;
  }

  function uangTampil(teks) {
    return [...teks.matchAll(/Rp [\d.]+,\d{2}/g)].map((item) => item[0]);
  }

  return { ambil, harusMemuat, uangTampil };
}
