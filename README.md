# ⚔️ Fantasy Quest – 3D Web ARPG Prototipi

Tarayıcı üzerinde çalışan, hiçbir harici 3D model (`.gltf`, `.obj`), doku (`.png`, `.jpg`) veya ses (`.mp3`, `.wav`) dosyasına ihtiyaç duymadan; tamamen **Vanilla JavaScript**, **Three.js** ve **Web Audio API** kullanılarak prosedürel olarak geliştirilmiş profesyonel bir 3D Aksiyon RPG (ARPG) prototipi.

---

## 🌟 Öne Çıkan Özellikler

- 🧱 **Katı Fizik ve Duvar Kaydırma (Wall Sliding):** Haritadaki 9 kale suru, 18 kule, Tudor evleri ve arena monolitleri dahil 131 katı engel. Çapraz hareketlerde duvara takılmayı önleyen bağımsız eksenli teğet kayma fiziği ve mermi bloklama.
- 🎥 **Travma Tabanlı Kamera Sarsıntısı & FOV Punch:** Karesel sönümlenen ($\text{Shake} = \text{Trauma}^2$) modern ekran sarsıntı algoritması, darbe yönüne göre açısal roll ve kritik vuruşlarda anlık FOV yakınlaşması.
- 📈 **1 - 100 Seviye RPG Denge Eğrisi:** Üstel şişmeyi önleyen polinomik formüllerle ölçeklenen canavar canı/hasarı, azalan verimli zırh mekaniği ve 4 temel nitelik puanı (STR, INT, DEX, VIT).
- 🗺️ **10 Tematik Biyom ve 9 Kale Kapısı:** 200 x 690 birimlik devasa harita (Zümrüt Vadi'den Kadim Kozmik Taht'a). Her bölge geçişinde seviye kilitli parlayan büyülü mühür bariyerleri (`window.gateBarriers`).
- 💀 **10 World Boss ve Taktiksel Yapay Zeka:** 
  * Yakın dövüşçüler (Melee rush)
  * Menzil koruyan kaçaklar (Ranged kiting)
  * Alan etkili ağır saldırı öncesi yerde 1.5 saniye büyüyen kırmızı tehlike çemberi açan Bosslar (AoE Telegraphing).
- 🎵 **Prosedürel Ses Sentezleyici (Web Audio API):** Kılıç savurma, et çarpması, alev patlaması, seviye atlama melodisi ve kükremeleri gerçek zamanlı frekans osilatörleri ile sıfır ses dosyasıyla üretir.
- ⚡ **Performans (Object Pooling) ve Otomatik Kayıt:** Mermi ve partiküller için nesne havuzu (sıfır GC takılması) ve `localStorage` JSON otomatik kayıt/devam sistemi.

---

## 🎮 Kontroller

| Tuş / Eylem | İşlev |
|---|---|
| **W, A, S, D** / **Yön Tuşları** | Karakter Hareketi |
| **Shift** | Hızlı Koşu / Depar (1.45x) |
| **Boşluk (Space)** | Zıplama |
| **Sol Tık + Sağ Tık** | İleri Koşma (MMORPG Tarzı) |
| **Fare Hareketi** | 3D Zemin Nişangahı & Hedefleme |
| **Sol Tık** | Temel Saldırı (Kılıç / Büyü Küresi / Ok) |
| **Sağ Tık + Sürükle** | Serbest 360° Kamera Rotasyonu |
| **2 veya Q** | Elementel Sınıf Yeteneği |
| **R** | Kadim Sınıf Ultisi (Kılıç Fırtınası / Meteor / Ok Yağmuru) |
| **C** | Karakter Sayfası & Nitelik Dağıtımı (STR, INT, DEX, VIT) |
| **I** | 16 Yuvalı Envanter Çantası |
| **1** | Şifa İksiri |

---

## 📂 Dosya Mimarisi

```
fantasy-rpg/
├── index.html        # DOM öğeleri, HUD, Minimap Canvas ve Karakter Sihirbazı
├── style.css         # Karanlık Orta Çağ arayüz stilleri ve animasyonlar
├── postprocessing.js # Özel vignette, tone mapping ve renk derecelendirme
├── audio.js          # Harici dosyasız Web Audio API prosedürel ses sentezleyici
├── world.js          # Küresel durum (G), 10 biyom, zemin, ışıklar ve katı engeller
├── models.js         # Prosedürel 3D mesh fabrikası (Karakterler, donanımlar, 10 Boss)
├── entities.js       # Fizik, dövüş, kamera sarsıntısı, yapay zeka, nesne havuzu
├── ui.js             # 2D Canvas minimap radarı, HUD senkronizasyonu ve pencereler
├── main.js           # 60 FPS oyun döngüsü (gameLoop), girdi dinleyicileri, atmosfer
└── README.md         # Proje dokümantasyonu
```

---

## 🚀 Nasıl Çalıştırılır?

Herhangi bir yerel HTTP sunucusu ile `index.html` dosyasını tarayıcınızda açabilirsiniz:

```bash
# Python ile:
python -m http.server 8080

# Node.js (npx) ile:
npx serve -l 8080
```

Tarayıcınızda **`http://localhost:8080`** adresine giderek maceraya başlayabilirsiniz!
