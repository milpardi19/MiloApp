import React from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';

export function KeyboardProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

export function KeyboardStickyView({ children, ...props }: React.PropsWithChildren<ViewProps>) {
  return <View {...props}>{children}</View>;
}

export function KeyboardAvoidingView({ children, ...props }: React.PropsWithChildren<ViewProps & { behavior?: string; enabled?: boolean }>) {
  const { behavior: _behavior, enabled: _enabled, ...viewProps } = props;
  return <View {...viewProps}>{children}</View>;
}

export function KeyboardAwareScrollView({ children, ...props }: React.PropsWithChildren<ScrollViewProps & { bottomOffset?: number; enabled?: boolean; extraKeyboardSpace?: number }>) {
  const { bottomOffset: _bottomOffset, enabled: _enabled, extraKeyboardSpace: _extraKeyboardSpace, ...scrollProps } = props;
  return <ScrollView {...scrollProps}>{children}</ScrollView>;
}
