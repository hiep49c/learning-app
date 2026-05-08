#!/bin/bash
echo "=== APK files ==="
find /home/hiepnt/projects/app -name "*.apk" -type f -exec ls -lh {} \;
echo "---"
echo "=== Copy to Windows Desktop ==="
APK="/home/hiepnt/projects/app/java-spring-course.apk"
if [ -f "$APK" ]; then
    # Try common Windows user paths
    for USER_DIR in /mnt/c/Users/*/Desktop; do
        if [ -d "$USER_DIR" ]; then
            cp "$APK" "$USER_DIR/java-spring-course.apk"
            echo "Copied to: $USER_DIR/java-spring-course.apk"
            break
        fi
    done
else
    # Try from gradle output
    GRADLE_APK=$(find /home/hiepnt/projects/app/android -name "*.apk" -type f 2>/dev/null | head -1)
    if [ -n "$GRADLE_APK" ]; then
        cp "$GRADLE_APK" /home/hiepnt/projects/app/java-spring-course.apk
        echo "Copied gradle APK to project root"
        for USER_DIR in /mnt/c/Users/*/Desktop; do
            if [ -d "$USER_DIR" ]; then
                cp "$GRADLE_APK" "$USER_DIR/java-spring-course.apk"
                echo "Copied to: $USER_DIR/java-spring-course.apk"
                break
            fi
        done
    else
        echo "No APK found!"
    fi
fi
