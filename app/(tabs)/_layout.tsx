import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabIconProps {
  color: string;
  size: number;
  name: IconName;
}

function TabIcon({ color, size, name }: TabIconProps) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
    />
  );
}

/**
 * Tab navigator layout — 5 tabs with Vietnamese labels.
 * Icons use MaterialCommunityIcons from @expo/vector-icons.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6200ee',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Trang chủ',
        }}
      />
      <Tabs.Screen
        name="course"
        options={{
          title: 'Java Spring',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="book-open-variant" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Java Spring',
        }}
      />
      <Tabs.Screen
        name="english"
        options={{
          title: 'Tiếng Anh',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="alphabetical-variant" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Tiếng Anh',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="magnify" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Tìm kiếm',
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Đánh dấu',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="bookmark" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Đánh dấu',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: 'Hồ sơ',
        }}
      />
    </Tabs>
  );
}
