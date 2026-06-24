# 🎨 Lizier Tools

**SVG to Alight Motion XML Converter** - Konversi file SVG menjadi XML yang kompatibel dengan Alight Motion.

## ✨ Features

- 🧩 **Modular Architecture** - Kode terstruktur rapi (core, parsers, math, styles, am-engine)
- 🔷 **Smart Shape Detection** - Auto-detect rect, circle, roundrect, poly, star
- 🌈 **Gradient Support** - Full support untuk `userSpaceOnUse` & `objectBoundingBox`
- ✂️ **Smart Auto-Close** - Path dengan fill otomatis ditutup dengan `Z`
- 📏 **Accurate Stroke** - Ketebalan stroke 100% akurat (no more 0.5x bug)
- 🎯 **6 Decimal Precision** - Kurva Bezier mulus tanpa patah-patah
- 📁 **Group Preservation** - Struktur layer/group dipertahankan dengan `embedScene`

## 🚀 Quick Start

```bash
# Clone repo
git clone https://github.com/username/lizier-tools.git
cd lizier-tools

# Install dependencies
npm install

# Run dev server
npm run dev -- --host
```

Buka browser di `http://localhost:5173`

## 📱 Usage

1. Upload file SVG atau paste kode SVG
2. Pilih layer yang ingin di-convert
3. Atur settings (resolution, gradient, stroke, dll)
4. Klik **⚡ CONVERT TO XML**
5. Download XML dan import ke Alight Motion

## 🧪 Tested With

- ✅ Google Logo SVG
- ✅ MF_Design (complex gradients)
- ✅ Various geometric shapes
- ✅ Adobe Illustrator exports

## 🛠️ Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS

## 📄 License

MIT

---

Made with ❤️ for Alight Motion community
