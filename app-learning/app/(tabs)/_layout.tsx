import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ color, size, name }: { color: string; size: number; name: IconName }): React.JSX.Element {
  return <MaterialCommunityIcons name={name} size={size} color={color} accessibilityElementsHidden />;
}

export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: '#6200ee' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Trang chủ',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Học',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="book-open-variant" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Học',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => <TabIcon name="magnify" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Tìm kiếm',
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Đánh dấu',
          tabBarIcon: ({ color, size }) => <TabIcon name="bookmark" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Đánh dấu',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <TabIcon name="account" color={color} size={size} />,
          tabBarAccessibilityLabel: 'Hồ sơ',
        }}
      />
      {/* Hide old tabs from tab bar */}
      <Tabs.Screen name="course" options={{ href: null }} />
      <Tabs.Screen name="english" options={{ href: null }} />
    </Tabs>
  );
}
