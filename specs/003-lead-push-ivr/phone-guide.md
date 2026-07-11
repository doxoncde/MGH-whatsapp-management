# MGH Bot Phone — Hardware Requirements & Buyer's Guide

---

## Minimum Requirements

| Spec | Minimum | Why |
|------|---------|-----|
| **SoC** | Snapdragon (any SD4xx or higher) | `Incall_Music Audio Mixer` is in Qualcomm's ALSA driver — essential for IVR audio injection. **Mediatek/Exynos/Tensor WILL NOT WORK. No Incall_Music control.** |
| **RAM** | 4 GB | Termux + Node.js + WhatsApp running 24/7. 3 GB works but gets laggy |
| **Storage** | 32 GB | OS + WhatsApp media cache + Termux. 16 GB fills up fast with WhatsApp |
| **Android** | 9.0+ (Android 10+ preferred) | `dumpsys telephony.registry` works on all. Android 10+ has better notification access |
| **Battery** | 3000 mAh+ | Plugged in 24/7, but needs ACC Magisk module to prevent swelling |
| **Bootloader** | Unlockable (official or unofficial) | Required for Magisk root. Xiaomi/OnePlus are easiest |
| **SIM** | Single SIM is fine (dual SIM better) | One SIM for MGH number. Dual SIM = keep personal SIM too |
| **3.5mm jack** | Nice to have, not essential | Physical audio loopback cable if tinymix fails |

---

## Top Picks (Budget, Used Market — OLX/FB Marketplace India)

### 🥇 #1 — Xiaomi POCO F1 (beryllium)

**The undisputed king of budget custom ROM phones. Legendary XDA support.**

| Spec | Value |
|------|-------|
| SoC | Snapdragon 845 (8-core, 2.8 GHz) |
| RAM | 6/8 GB |
| Storage | 64/128 GB |
| Battery | 4000 mAh |
| LineageOS | ✅ Official (up to latest) |
| XDA threads | 10,000+ threads, 50+ custom ROMs |
| Magisk | ✅ Fully supported |
| Used price (OLX) | ₹3,500 – ₹6,000 |
| Cam | Usable (not needed anyway) |

**Why it's #1**: The SD845 has the `Incall_Music Audio Mixer` control. Massive community — any problem has already been solved. The "beryllium" codename is famous; you'll find guides for literally everything. 6+ GB RAM means zero lag for our bot.

**Watch for**: Battery health. Many units are 4-5 years old — battery may be degraded. Budget ₹500-800 for replacement battery. Also check for screen burn-in (common on this model).

---

### 🥈 #2 — OnePlus 6 (enchilada) / 6T (fajita)

**Clean bootloader unlock, excellent community, near-stock experience.**

| Spec | OnePlus 6 | OnePlus 6T |
|------|-----------|------------|
| SoC | SD 845 | SD 845 |
| RAM | 6/8 GB | 6/8 GB |
| Storage | 64/128/256 GB | 128/256 GB |
| Battery | 3300 mAh | 3700 mAh |
| LineageOS | ✅ Official | ✅ Official |
| Used price | ₹4,500 – ₹7,500 | ₹5,000 – ₹8,000 |

**Why it's great**: OnePlus has the easiest bootloader unlock (fastboot oem unlock). No waiting period like Xiaomi. Alert slider is handy to mute notifications. 6T has bigger battery and no headphone jack (but we don't need the jack for this project).

**Watch for**: Dash charging port wear. Some units have Type-C port issues. Test charging before buying.

---

### 🥉 #3 — Xiaomi Redmi Note 9 Pro (miatoll)

**Newer, bigger battery, still cheap.**

| Spec | Value |
|------|-------|
| SoC | Snapdragon 720G |
| RAM | 4/6 GB |
| Storage | 64/128 GB |
| Battery | 5020 mAh (!) |
| LineageOS | ✅ Official (miatoll) |
| Used price | ₹4,000 – ₹7,000 |

**Why it's great**: Massive 5020 mAh battery — can run for days if power goes out. SD720G is newer (2020) and more power-efficient. Multiple market variants (Redmi Note 9S, Note 9 Pro, Note 10 Lite, Poco M2 Pro) — easier to find used.

**Watch for**: MIUI bootloader unlock waiting period (7 days). Budget that time. 4 GB variant works but 6 GB is better.

---

### 🏅 #4 — POCO X3 Pro (vayu)

**Beastly performance for the price, active XDA community.**

| Spec | Value |
|------|-------|
| SoC | Snapdragon 860 |
| RAM | 6/8 GB |
| Storage | 128 GB |
| Battery | 5160 mAh |
| LineageOS | ✅ Official |
| Magisk | ✅ Fully supported |
| Used price | ₹5,500 – ₹8,500 |

**Why it's great**: SD860 is a monster — essentially an overclocked SD855+. 120Hz display (irrelevant for our bot but nice to have). Enormous battery. Active XDA forum.

**Watch for**: Some units have PMIC (power management) chip failures. Check that it charges and holds charge properly. Avoid units that randomly reboot.

---

### 🏅 #5 — Moto G series (Snapdragon variants)

**Clean Android, less bloat, good for always-on use.**

| Model | Codename | SoC | RAM | Used Price |
|-------|----------|-----|-----|------------|
| Moto G32 | devon | SD 680 | 4/6 GB | ₹4,000 – ₹6,500 |
| Moto G52 | rhode | SD 680 | 4/6 GB | ₹4,500 – ₹7,000 |
| Moto G82 5G | rhodep | SD 695 | 6 GB | ₹5,500 – ₹9,000 |
| Moto G200 5G | xpeng | SD 888+ | 8 GB | ₹8,000 – ₹13,000 |

All have official LineageOS support.

**Why Moto**: Near-stock Android means less bloat. Unlocking bootloader is straightforward. But XDA community is smaller than Xiaomi/OnePlus — fewer custom ROMs.

---

### 🏅 #6 — Samsung Galaxy (Snapdragon) with LineageOS

| Model | Codename | SoC | Note |
|-------|----------|-----|------|
| S20 FE 5G | r8q | SD 865 | ✅ Official LineageOS |
| A52s 5G | a52sxq | SD 778G | ✅ Official LineageOS |
| A52 4G | a52q | SD 720G | ✅ Official LineageOS |
| A73 5G | a73xq | SD 778G | ✅ Official LineageOS |

**Warning**: Samsung bootloader unlock trips Knox permanently. Samsung Pay, Secure Folder, and some banking apps die forever. Only use a Samsung if you truly don't care about Knox. Many Samsung phones in India use Exynos — verify the EXACT model has Snapdragon.

---

## Phones to AVOID

| Brand/SoC | Why Avoid |
|-----------|-----------|
| **Mediatek (Helio/Dimensity)** | No `Incall_Music Audio Mixer`. Mediatek uses different audio HAL. tinymix controls are inconsistent. |
| **Exynos** | Samsung's Exynos has no `Incall_Music` control. Audio routing locked down. |
| **Google Pixel (Tensor)** | Bootloader unlock works, Magisk works, but Tensor has NO Incall_Music mixer. Also expensive. |
| **OPPO/Vivo/Realme** | Aggressive bootloader lock. Many can't be unlocked at all. Not worth the hassle. |
| **Huawei** | Bootloader permanently locked since 2018. |
| **iPhone** | This should be obvious, but WhatsApp UI automation and Termux don't exist on iOS. |
| **Phones with < 3 GB RAM** | WhatsApp + Termux + Node.js = memory pressure. Phone will kill Termux to save RAM. |
| **Phones without official LineageOS** | Unofficial ROMs exist but you're betting on a single maintainer. Stick to official. |

---

## What to Check When Buying Used (OLX/FB Marketplace)

1. **Is it Snapdragon?** — Install CPU-Z or DevCheck before paying. Many sellers don't know/lie.
2. **Bootloader unlockable?** — Check XDA if that specific variant (e.g., Indian vs Global) has unlock. Some carrier-locked variants can't be unlocked.
3. **Battery health** — AccuBattery or dial `*#*#6485#*#*` (Xiaomi). Below 70% health = budget ₹800 for replacement.
4. **Screen condition** — Burn-in, dead pixels, ghost touches. Run a screen test app.
5. **Charging port** — Plug in, wiggle cable. If it disconnects, walk away.
6. **IMEI/network** — Make a test call. Ensure SIM slot works and IMEI isn't blacklisted.
7. **No MDM/factory lock** — Some corporate phones have MDM locks that prevent factory reset.
8. **Water damage** — Check LDI (liquid damage indicator) inside SIM tray. Should be white, not red.
9. **FRP (Factory Reset Protection)** — After factory reset, make sure it doesn't ask for previous Google account.

---

## Magisk & SafetyNet/Play Integrity Status

Rooting with Magisk triggers Play Integrity failure. On a **dedicated bot phone, this is fine** because:

- WhatsApp works perfectly on rooted devices
- Termux works with root (actually better)
- Shizuku works BETTER with root

Apps that might break but we DON'T need:
- Google Pay / PhonePe (not the bot phone)
- Netflix HD / banking apps (use another phone)
- Some games with anti-cheat

If you DO want Play Integrity to pass (for dual-use as a personal phone):

1. Install **Play Integrity Fix** Magisk module
2. Install **Zygisk** (built into Magisk)
3. Configure DenyList for banking apps
4. This gets you **DEVICE_INTEGRITY** (most apps work)
5. **STRONG_INTEGRITY** requires locked bootloader — not possible with Magisk

---

## Battery Bypass for 24/7 Operation

The phone will be plugged in 24/7. Without protection, battery swells within 6-12 months.

**Solution: ACC (Advanced Charging Controller) Magisk module**

```bash
# Install ACC
# Download from Magisk Modules or GitHub
# Configure:
su -c 'acc -s pc=60'        # Pause charging at 60%
su -c 'acc -s rc=40'        # Resume charging at 40%

# Battery stays between 40-60% forever = no swelling
# Phone runs directly off USB power when at target %
```

Most Snapdragon phones support this — ACC disconnects the battery circuit and runs purely on external power once the target charge is reached.

---

### 🌟 Bonus: Realme X2 Pro (RMX1931)

**If you already own one — this is an excellent bot phone. Better than POCO F1.**

| Spec | Value |
|------|-------|
| SoC | Snapdragon 855+ (8-core, 2.96 GHz) |
| RAM | 8/12 GB |
| Storage | 128/256 GB |
| Battery | 4000 mAh |
| Custom ROMs | PixelOS, crDroid, Evolution X, LineageOS unofficially |
| Magisk | ✅ Fully supported |
| Android | Up to 13 (PixelOS) / 14 (some ROMs) |

**Why it's excellent**: The SD855+ is one generation newer than the POCO F1's SD845. `Incall_Music Audio Mixer` control is confirmed on SD855+ (same Qualcomm msm-pcm-routing driver). 8+ GB RAM means zero memory pressure. UFS 3.0 storage is fast. 

**Known issue**: Bootloader unlock on Realme requires the DeepTest APK from Realme — but since your phone is already on PixelOS with Magisk, this is already done.

**Existing setup (your phone)**: PixelOS (Android 13), Magisk pre-installed. No additional unlocks needed.

---

## Final Recommendation

| Budget | Best Pick | Alternate |
|--------|-----------|-----------|
| **₹3,500 – ₹5,000** | POCO F1 (6 GB) | Redmi Note 9 Pro |
| **₹5,000 – ₹7,000** | OnePlus 6T | POCO X3 Pro |
| **₹7,000 – ₹10,000** | POCO X3 Pro (8 GB) | Moto G82 5G |

**If you can find a POCO F1 in good condition, buy it.** The SD845 + 6 GB RAM + legendary XDA support is the gold standard for any Android bot project. Over 10,000 XDA threads, guides for every possible modification, and the `Incall_Music Audio Mixer` control is confirmed working on this SoC.
