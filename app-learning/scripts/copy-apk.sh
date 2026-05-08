#!/bin/bash
SRC="/home/hiepnt/projects/app/java-spring-course.apk"
echo "Source: $SRC"
ls -lh "$SRC" 2>/dev/null || echo "APK NOT FOUND at $SRC"

# Try to copy to all Windows user Desktops
for DESKTOP in /mnt/c/Users/*/Desktop; do
    if [ -d "$DESKTOP" ]; then
        cp "$SRC" "$DESKTOP/java-spring-course.apk" 2>/dev/null
        echo "Copied to: $DESKTOP/java-spring-course.apk"
        ls -lh "$DESKTOP/java-spring-course.apk"
    fi
done

# Also copy to Downloads
for DL in /mnt/c/Users/*/Downloads; do
    if [ -d "$DL" ]; then
        cp "$SRC" "$DL/java-spring-course.apk" 2>/dev/null
        echo "Copied to: $DL/java-spring-course.apk"
    fi
done

echo ""
echo "Done. Check your Windows Desktop or Downloads folder."
