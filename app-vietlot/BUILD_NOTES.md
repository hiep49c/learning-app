# Android APK Build Notes

## Lỗi: APK cài không được (popup cài đặt hiện lên nhưng không phản hồi)

### Nguyên nhân
- Chỉ có `mipmap-anydpi-v26/ic_launcher.xml` mà **không có fallback icon** cho Android < 8 (API < 26)
- Installer crash khi parse icon resource không tồn tại

### Fix
1. Tạo `res/drawable/ic_launcher.xml` làm fallback icon
2. Manifest dùng `android:icon="@drawable/ic_launcher"` thay vì `@mipmap/ic_launcher`
3. Hoặc tạo đủ PNG trong `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`

### Checklist build APK release
- [ ] Icon có fallback cho mọi API level (không chỉ anydpi-v26)
- [ ] `android:installLocation="auto"` trong manifest
- [ ] signingConfig release dùng debug.keystore (hoặc release key)
- [ ] Copy APK gốc từ `app/build/outputs/apk/release/app-release.apk`
- [ ] Verify bằng `apksigner verify`
