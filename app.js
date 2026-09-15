/* ====== Navbar ====== */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
burger.addEventListener("click", () => {
  nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", nav.classList.contains("open"));
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);
const sections = [...document.querySelectorAll("main section")];
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      nav.querySelectorAll("a").forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)
      );
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => observer.observe(s));

/* ====== Tabs simulasi ====== */
const tabs = [...document.querySelectorAll(".tab")];
function openTab(name) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) =>
    p.classList.toggle("active", p.id === "panel-" + name)
  );
}
tabs.forEach((t) => t.addEventListener("click", () => openTab(t.dataset.tab)));
document.querySelectorAll("[data-open-tab]").forEach((btn) =>
  btn.addEventListener("click", () => openTab(btn.dataset.openTab))
);

/* ====== Simulator Pseudocode ====== */
const CONTOH = {
  pagi: `MULAI
  TULIS "Bangun tidur"
  TULIS "Merapikan tempat tidur"
  TULIS "Mandi"
  TULIS "Sarapan"
  TULIS "Berangkat ke sekolah"
SELESAI`,
  cuaca: `MULAI
  cuaca <- "hujan"
  JIKA cuaca = "hujan" MAKA
    TULIS "Bawa payung sebelum berangkat"
  SELAIN ITU
    TULIS "Cuaca cerah, pakai topi saja"
  AKHIR JIKA
SELESAI`,
  hp: `MULAI
  tugas <- "selesai"
  JIKA tugas = "selesai" MAKA
    TULIS "Boleh main HP dulu"
  SELAIN ITU
    TULIS "Kerjakan tugasnya dulu ya"
  AKHIR JIKA
SELESAI`,
  ulang: `MULAI
  TULIS "Membuat es teh manis"
  UNTUK i <- 1 SAMPAI 3 LAKUKAN
    TULIS "Aduk teh... putaran ke-", i
  AKHIR UNTUK
  TULIS "Es teh siap disajikan"
SELESAI`,
  lapar: `MULAI
  lapar <- BENAR
  SELAMA lapar LAKUKAN
    TULIS "Makan satu suap..."
    lapar <- SALAH
  AKHIR SELAMA
  TULIS "Kenyang, terima kasih Bu Kantin!"
SELESAI`,
  ulangi: `MULAI
  piring <- "kotor"
  ULANGI
    TULIS "Cuci satu piring..."
    piring <- "bersih"
  SAMPAI piring = "bersih"
  TULIS "Semua piring sudah bersih"
SELESAI`,
  masukkan: `MULAI
  MASUKKAN nama
  TULIS "Halo, ", nama, "! Selamat datang di kelas."
  MASUKKAN cuaca
  JIKA cuaca = "hujan" MAKA
    TULIS "Jangan lupa bawa payung ya"
  SELAIN ITU
    TULIS "Cuaca cerah, pakai topi saja"
  AKHIR JIKA
SELESAI`,
};

const editor = document.getElementById("editor");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");
editor.value = CONTOH.pagi;

document.getElementById("contohPilih").addEventListener("change", (e) => {
  if (CONTOH[e.target.value]) editor.value = CONTOH[e.target.value];
});
document.getElementById("clearBtn").addEventListener("click", () => {
  editor.value = "MULAI\n  \nSELESAI";
  setStatus("siap", "");
  output.textContent = "Tekan “Jalankan” untuk melihat hasil.";
});
document.getElementById("runBtn").addEventListener("click", run);

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = "status " + cls;
}

/* Tampilan materi memakai kata kunci Indonesia. Padanan Inggris (INPUT, OUTPUT, WHILE, FOR, REPEAT-UNTIL, IF-THEN-ELSE)
   diterjemahkan dulu ke kata kunci Indonesia agar keduanya bisa dipakai. */
function normalize(t) {
  const rules = [
    [/^BEGIN$/i, "MULAI"],
    [/^END\s*IF$/i, "AKHIR JIKA"],
    [/^END\s*WHILE$/i, "AKHIR SELAMA"],
    [/^END\s*FOR$/i, "AKHIR UNTUK"],
    [/^END(\s+PROGRAM)?$/i, "SELESAI"],
    [/^IF\s+(.+?)\s+THEN$/i, "JIKA $1 MAKA"],
    [/^ELSE$/i, "SELAIN ITU"],
    [/^WHILE\s+(.+?)(?:\s+DO)?$/i, "SELAMA $1 LAKUKAN"],
    [/^FOR\s+([A-Za-z_]\w*)\s*(?:<-|=)\s*(.+?)\s+TO\s+(.+?)(?:\s+DO)?$/i, "UNTUK $1 <- $2 SAMPAI $3 LAKUKAN"],
    [/^REPEAT$/i, "ULANGI"],
    [/^UNTIL\s+(.+)$/i, "SAMPAI $1"],
    [/^INPUT\s+(.+)$/i, "MASUKKAN $1"],
    [/^OUTPUT\b\s*/i, "TULIS "],
  ];
  for (const [re, rep] of rules) if (re.test(t)) return t.replace(re, rep).trim();
  return t;
}

function runProgram(src, ask) {
  const lines = src
    .split("\n")
    .map((l, i) => ({ no: i + 1, text: normalize(l.trim()) }))
    .filter((l) => l.text !== "" && !l.text.startsWith("//"));

  const out = [];
  const vars = Object.create(null);
  try {
    let body = lines;
    if (body.length && up(body[0].text) === "MULAI") body = body.slice(1);
    else throw err(lines[0] ? lines[0].no : 1, 'program harus dimulai dengan "MULAI"');
    const last = body[body.length - 1];
    if (!last || up(last.text) !== "SELESAI")
      throw err(last ? last.no : 1, 'program harus diakhiri dengan "SELESAI"');
    body = body.slice(0, -1);
    exec(parseBlock(body, 0, body.length), vars, out, { steps: 0, ask });
    return { ok: true, text: out.length ? out.join("\n") : "(program selesai tanpa keluaran)" };
  } catch (e) {
    return {
      ok: false,
      text: (out.length ? out.join("\n") + "\n\n" : "") + "⚠ ERROR — " + e.message,
    };
  }
}

function run() {
  const r = runProgram(editor.value);
  output.textContent = r.text;
  setStatus(r.ok ? "berhasil ✓" : "gagal ✕", r.ok ? "ok" : "err");
}

const up = (s) => s.toUpperCase();
function err(line, msg) {
  return new Error("baris " + line + ": " + msg);
}

/* --- parser: menghasilkan daftar statement --- */
function parseBlock(lines, start, end) {
  const stmts = [];
  let i = start;
  while (i < end) {
    const line = lines[i];
    const u = up(line.text);
    if (u.startsWith("JIKA ")) {
      const m = line.text.match(/^JIKA\s+(.+?)\s+MAKA$/i);
      if (!m) throw err(line.no, 'gunakan format "JIKA syarat MAKA"');
      const close = findEnd(lines, i + 1, end, ["JIKA"], "AKHIR JIKA", line.no);
      const elseIdx = findElse(lines, i + 1, close);
      stmts.push({
        t: "if",
        no: line.no,
        cond: m[1],
        then: parseBlock(lines, i + 1, elseIdx === -1 ? close : elseIdx),
        else: elseIdx === -1 ? [] : parseBlock(lines, elseIdx + 1, close),
      });
      i = close + 1;
    } else if (u.startsWith("SELAMA ")) {
      const m = line.text.match(/^SELAMA\s+(.+?)\s+LAKUKAN$/i);
      if (!m) throw err(line.no, 'gunakan format "SELAMA syarat LAKUKAN"');
      const close = findEnd(lines, i + 1, end, ["SELAMA"], "AKHIR SELAMA", line.no);
      stmts.push({ t: "while", no: line.no, cond: m[1], body: parseBlock(lines, i + 1, close) });
      i = close + 1;
    } else if (u.startsWith("UNTUK ")) {
      const m = line.text.match(/^UNTUK\s+([A-Za-z_]\w*)\s*(?:<-|=)\s*(.+?)\s+SAMPAI\s+(.+?)\s+LAKUKAN$/i);
      if (!m) throw err(line.no, 'gunakan format "UNTUK i <- 1 SAMPAI 5 LAKUKAN"');
      const close = findEnd(lines, i + 1, end, ["UNTUK"], "AKHIR UNTUK", line.no);
      stmts.push({
        t: "for",
        no: line.no,
        v: m[1],
        from: m[2],
        to: m[3],
        body: parseBlock(lines, i + 1, close),
      });
      i = close + 1;
    } else if (u === "ULANGI") {
      const close = findRepeatEnd(lines, i + 1, end, line.no);
      const cond = lines[close].text.replace(/^SAMPAI\s+/i, "");
      stmts.push({ t: "repeat", no: line.no, cond, body: parseBlock(lines, i + 1, close) });
      i = close + 1;
    } else if (/^(MASUKKAN|BACA)\s+/i.test(line.text)) {
      const m = line.text.match(/^(?:MASUKKAN|BACA)\s+([A-Za-z_]\w*)$/i);
      if (!m) throw err(line.no, 'gunakan format "MASUKKAN nama"');
      stmts.push({ t: "input", no: line.no, v: m[1] });
      i++;
    } else if (/^(TULIS|TAMPILKAN|CETAK|OUTPUT)\b/i.test(line.text)) {
      stmts.push({ t: "print", no: line.no, args: line.text.replace(/^\w+\s*/, "") });
      i++;

    } else if (/^[A-Za-z_]\w*\s*(<-|=)/.test(line.text)) {
      const m = line.text.match(/^([A-Za-z_]\w*)\s*(?:<-|=)\s*(.+)$/);
      stmts.push({ t: "set", no: line.no, v: m[1], expr: m[2] });
      i++;
    } else {
      throw err(line.no, 'perintah tidak dikenali → "' + line.text + '"');
    }
  }
  return stmts;
}
function findEnd(lines, i, end, openers, closer, openNo) {
  let depth = 0;
  for (; i < end; i++) {
    const u = up(lines[i].text);
    if (openers.some((o) => u.startsWith(o + " "))) depth++;
    else if (u === closer) {
      if (depth === 0) return i;
      depth--;
    }
  }
  throw err(openNo, 'blok belum ditutup dengan "' + closer + '"');
}
function findElse(lines, i, end) {
  let depth = 0;
  for (; i < end; i++) {
    const u = up(lines[i].text);
    if (u.startsWith("JIKA ")) depth++;
    else if (u === "AKHIR JIKA") depth--;
    else if (depth === 0 && (u === "SELAIN ITU" || u === "LAINNYA")) return i;
  }
  return -1;
}
function findRepeatEnd(lines, i, end, openNo) {
  let depth = 0;
  for (; i < end; i++) {
    const u = up(lines[i].text);
    if (u === "ULANGI") depth++;
    else if (/^SAMPAI\s+/.test(u)) {
      if (depth === 0) return i;
      depth--;
    }
  }
  throw err(openNo, 'blok ULANGI belum ditutup dengan "SAMPAI syarat"');
}


/* --- eksekusi --- */
function exec(stmts, vars, out, guard) {
  for (const s of stmts) {
    if (++guard.steps > 20000) throw new Error("program terlalu lama berjalan (kemungkinan perulangan tak berhenti)");
    if (s.t === "set") vars[s.v] = evalExpr(s.expr, vars, s.no);
    else if (s.t === "input") {
      const raw = window.prompt('Masukkan nilai untuk "' + s.v + '"') ?? "";
      const val = raw.trim() !== "" && !isNaN(Number(raw)) ? Number(raw) : raw;
      vars[s.v] = val;
      out.push("↧ " + s.v + " = " + fmt(val));
    } else if (s.t === "repeat") {
      let n = 0;
      do {
        exec(s.body, vars, out, guard);
        if (++n > 5000) throw err(s.no, "perulangan ULANGI tidak pernah berhenti");
      } while (!evalExpr(s.cond, vars, s.no));
    }
    else if (s.t === "print") out.push(splitArgs(s.args).map((a) => fmt(evalExpr(a, vars, s.no))).join(""));

    else if (s.t === "if") exec(evalExpr(s.cond, vars, s.no) ? s.then : s.else, vars, out, guard);
    else if (s.t === "while") {
      let n = 0;
      while (evalExpr(s.cond, vars, s.no)) {
        exec(s.body, vars, out, guard);
        if (++n > 5000) throw err(s.no, "perulangan SELAMA tidak pernah berhenti");
      }
    } else if (s.t === "for") {
      const from = Number(evalExpr(s.from, vars, s.no));
      const to = Number(evalExpr(s.to, vars, s.no));
      const step = to >= from ? 1 : -1;
      for (let k = from; step > 0 ? k <= to : k >= to; k += step) {
        vars[s.v] = k;
        exec(s.body, vars, out, guard);
      }
    }
  }
}
function fmt(v) {
  if (typeof v === "boolean") return v ? "BENAR" : "SALAH";
  return String(v);
}
function splitArgs(str) {
  const parts = [];
  let cur = "", q = null, depth = 0;
  for (const ch of str) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim());
}
function toJS(expr) {
  // pisahkan literal string supaya kata di dalamnya tidak diubah
  const chunks = expr.split(/("(?:[^"\\]|\\.)*")/);
  return chunks
    .map((c, i) => {
      if (i % 2 === 1) return c;
      return c
        .replace(/\bMOD\b/gi, "%")
        .replace(/\bDAN\b/gi, "&&")
        .replace(/\bATAU\b/gi, "||")
        .replace(/\bTIDAK\b/gi, "!")
        .replace(/\bBENAR\b/gi, "true")
        .replace(/\bSALAH\b/gi, "false")
        .replace(/<>/g, "!==")
        .replace(/<=/g, "@LE@")
        .replace(/>=/g, "@GE@")
        .replace(/(?<![!<>=])=(?!=)/g, "===")
        .replace(/@LE@/g, "<=")
        .replace(/@GE@/g, ">=");
    })
    .join("");
}
function evalExpr(expr, vars, no) {
  const js = toJS(expr);
  const names = Object.keys(vars);
  let fn;
  try {
    fn = new Function(...names, "return (" + js + ");");
  } catch (e) {
    throw err(no, 'ekspresi tidak valid → "' + expr + '"');
  }
  try {
    const v = fn(...names.map((n) => vars[n]));
    if (typeof v === "number" && Number.isNaN(v))
      throw err(no, "hasil bukan angka — cek variabel yang belum diberi nilai");
    return v;
  } catch (e) {
    if (e instanceof ReferenceError)
      throw err(no, "variabel " + e.message.split(" ")[0] + " belum diberi nilai");
    throw e.message && e.message.startsWith("baris") ? e : err(no, e.message);
  }
}

/* ====== Simulasi Struktur Data ====== */
// Array — loker
const SLOTS = 6;
const arr = new Array(SLOTS).fill(null);
const lockersEl = document.getElementById("lockers");
function drawLockers(hit) {
  lockersEl.innerHTML = arr
    .map(
      (v, i) =>
        `<div class="locker ${hit === i ? "hit" : ""}"><b>[${i}]</b>${v === null ? "—" : v}</div>`
    )
    .join("");
}
drawLockers();
document.getElementById("arrSet").addEventListener("click", () => {
  const i = Number(document.getElementById("arrIdx").value);
  const v = document.getElementById("arrVal").value.trim();
  const log = document.getElementById("arrLog");
  if (!(i >= 0 && i < SLOTS)) return (log.textContent = "indeks harus 0 sampai " + (SLOTS - 1));
  if (!v) return (log.textContent = "isi loker dulu");
  arr[i] = v;
  drawLockers(i);
  log.textContent = `loker[${i}] <- "${v}"`;
});
document.getElementById("arrGet").addEventListener("click", () => {
  const i = Number(document.getElementById("arrIdx").value);
  const log = document.getElementById("arrLog");
  if (!(i >= 0 && i < SLOTS)) return (log.textContent = "indeks harus 0 sampai " + (SLOTS - 1));
  drawLockers(i);
  log.textContent = `TULIS loker[${i}] → ${arr[i] === null ? "kosong" : arr[i]}`;
});

// Stack — tumpukan buku
const stack = [];
const stackEl = document.getElementById("stack");
function drawStack() {
  stackEl.innerHTML = stack.length
    ? stack.map((b) => `<div class="book">${b}</div>`).join("")
    : '<span class="empty">tumpukan kosong</span>';
}
drawStack();
document.getElementById("stackPush").addEventListener("click", () => {
  const inp = document.getElementById("stackVal");
  const v = inp.value.trim() || "Buku " + (stack.length + 1);
  if (stack.length >= 6) return (document.getElementById("stackLog").textContent = "tumpukan penuh");
  stack.push(v);
  inp.value = "";
  drawStack();
  document.getElementById("stackLog").textContent = `push("${v}") — ditaruh paling atas`;
});
document.getElementById("stackPop").addEventListener("click", () => {
  const log = document.getElementById("stackLog");
  if (!stack.length) return (log.textContent = "tidak ada buku untuk diambil");
  const v = stack.pop();
  drawStack();
  log.textContent = `pop() → "${v}" (yang terakhir ditaruh, LIFO)`;
});

// Queue — antrian kantin
const queue = [];
const queueEl = document.getElementById("queue");
function drawQueue() {
  queueEl.innerHTML = queue.length
    ? queue.map((p, i) => `<div class="person">${i === 0 ? "▶ " : ""}${p}</div>`).join("")
    : '<span class="empty">antrian kosong</span>';
}
drawQueue();
document.getElementById("queuePush").addEventListener("click", () => {
  const inp = document.getElementById("queueVal");
  const v = inp.value.trim() || "Siswa " + (queue.length + 1);
  if (queue.length >= 7) return (document.getElementById("queueLog").textContent = "antrian sudah panjang");
  queue.push(v);
  inp.value = "";
  drawQueue();
  document.getElementById("queueLog").textContent = `enqueue("${v}") — masuk dari belakang`;
});
document.getElementById("queuePop").addEventListener("click", () => {
  const log = document.getElementById("queueLog");
  if (!queue.length) return (log.textContent = "belum ada yang mengantri");
  const v = queue.shift();
  drawQueue();
  log.textContent = `dequeue() → "${v}" dilayani (yang datang pertama, FIFO)`;
});


/* ====== LKPD — lembar jawaban siswa ====== */
const LKPD_SKELETON = `MULAI
  jam <- 7
  menit <- 15
  JIKA (jam < 7) ATAU (jam = 7 DAN menit = 0) MAKA
    TULIS "Silakan langsung masuk kelas"
  SELAIN ITU
    TULIS "Catat nama di buku keterlambatan"
    TULIS "Minta surat izin masuk dari guru piket"
  AKHIR JIKA
  TULIS "Selamat belajar, jaga kerapian seragam"
SELESAI`;

const lkpdEditor = document.getElementById("lkpdEditor");
const lkpdOutput = document.getElementById("lkpdOutput");
const lkpdStatus = document.getElementById("lkpdStatus");

if (lkpdEditor) {
  lkpdEditor.value = "MULAI\n  \nSELESAI";

  document.getElementById("lkpdSkeleton").addEventListener("click", () => {
    lkpdEditor.value = LKPD_SKELETON;
    lkpdEditor.focus();
  });

  document.getElementById("lkpdClear").addEventListener("click", () => {
    lkpdEditor.value = "MULAI\n  \nSELESAI";
    lkpdOutput.textContent = "Tekan “Jalankan” untuk menguji pseudocode buatanmu.";
    lkpdStatus.textContent = "siap";
    lkpdStatus.className = "status";
  });

  document.getElementById("lkpdRun").addEventListener("click", () => {
    const r = runProgram(lkpdEditor.value);
    lkpdOutput.textContent = r.text;
    lkpdStatus.textContent = r.ok ? "berhasil ✓" : "gagal ✕";
    lkpdStatus.className = "status " + (r.ok ? "ok" : "err");
  });

  document.getElementById("lkpdDownload").addEventListener("click", downloadLkpdImage);
}

function downloadLkpdImage() {
  const nama = (document.getElementById("lkpdNama").value || "").trim() || "Nama / Kelas: ______";
  const code = lkpdEditor.value.replace(/\t/g, "  ").split("\n");
  const hasil = (lkpdOutput.textContent || "").split("\n");

  const scale = 2;
  const W = 900;
  const pad = 40;
  const lh = 26;
  const headH = 130;
  const gap = 34;
  const H = headH + code.length * lh + gap + 40 + hasil.length * lh + pad + 40;

  const cv = document.createElement("canvas");
  cv.width = W * scale;
  cv.height = H * scale;
  const c = cv.getContext("2d");
  c.scale(scale, scale);

  c.fillStyle = "#0f1115";
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#6ee7b7";
  c.fillRect(0, 0, W, 8);

  c.fillStyle = "#ffffff";
  c.font = "bold 26px 'Space Grotesk', Arial, sans-serif";
  c.fillText("LKPD — Pseudocode Bercabang (JIKA / SELAIN ITU)", pad, 58);
  c.fillStyle = "#9aa4b2";
  c.font = "16px 'DM Sans', Arial, sans-serif";
  c.fillText(nama, pad, 86);
  c.fillText(
    "Studi kasus: Gerbang Sekolah Pukul 07.00 · " + new Date().toLocaleString("id-ID"),
    pad,
    110
  );

  let y = headH + 10;
  c.fillStyle = "#6ee7b7";
  c.font = "bold 16px 'DM Sans', Arial, sans-serif";
  c.fillText("PSEUDOCODE", pad, y);
  y += 22;
  c.font = "16px 'JetBrains Mono', Consolas, monospace";
  code.forEach((line, i) => {
    c.fillStyle = "#4b5563";
    c.fillText(String(i + 1).padStart(2, "0"), pad, y);
    c.fillStyle = "#e5e7eb";
    c.fillText(line, pad + 40, y);
    y += lh;
  });

  y += gap;
  c.fillStyle = "#fbbf24";
  c.font = "bold 16px 'DM Sans', Arial, sans-serif";
  c.fillText("HASIL PROGRAM", pad, y);
  y += 24;
  c.font = "16px 'JetBrains Mono', Consolas, monospace";
  c.fillStyle = "#e5e7eb";
  hasil.forEach((line) => {
    c.fillText(line, pad, y);
    y += lh;
  });

  const a = document.createElement("a");
  a.download =
    "LKPD-pseudocode-" + nama.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() + ".png";
  a.href = cv.toDataURL("image/png");
  a.click();
}
