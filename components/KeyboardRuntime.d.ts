import type React from 'react';
import type { ScrollViewProps, ViewProps } from 'react-native';

export function KeyboardProvider(props: React.PropsWithChildren): React.ReactElement;
export function KeyboardStickyView(
  props: React.PropsWithChildren<ViewProps & {
    offset?: { closed?: number; opened?: number };
    enabled?: boolean;
  }>,
): React.ReactElement;
export function KeyboardAvoidingView(
  props: React.PropsWithChildren<ViewProps & {
    behavior?: 'height' | 'position' | 'padding' | 'translate-with-padding';
    enabled?: boolean;
    keyboardVerticalOffset?: number;
    contentContainerStyle?: ViewProps['style'];
  }>,
): React.ReactElement;
export function KeyboardAwareScrollView(
  props: React.PropsWithChildren<ScrollViewProps & {
    bottomOffset?: number;
    enabled?: boolean;
    extraKeyboardSpace?: number;
  }>,
): React.ReactElement;
