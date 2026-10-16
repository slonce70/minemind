import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { feedback } from '../feel/feedback';
import { PixelIcon, type PixelIconName } from '../ui/pixel-icon';
import { avatarPresets } from './avatar-presets';
import { PlayerAvatar } from './player-avatar';

type AvatarPickerProps = {
  labels: Record<string, string>;
  onSelect: (avatarId: string) => void;
  selectedId: string;
};

export function AvatarPicker({ labels, onSelect, selectedId }: AvatarPickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.avatarGrid}>
      {avatarPresets.map((preset) => {
        const isActive = preset.id === selectedId;

        return (
          <Pressable
            accessibilityLabel={labels[preset.id] ?? preset.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
            key={preset.id}
            onPress={() => {
              feedback.tap();
              onSelect(preset.id);
            }}
            style={[styles.avatarCell, isActive && styles.avatarCellActive]}
          >
            <PlayerAvatar avatarId={preset.id} size={52} />
          </Pressable>
        );
      })}
    </View>
  );
}

type NicknameFieldProps = {
  diceLabel: string;
  error?: string | null;
  helper?: string;
  label: string;
  onChange: (value: string) => void;
  onRoll: () => void;
  placeholder: string;
  value: string;
};

/** Nickname input with a dice button that suggests a fresh word nickname. */
export function NicknameField({ diceLabel, error, helper, label, onChange, onRoll, placeholder, value }: NicknameFieldProps) {
  return (
    <View style={styles.field}>
      <Text nativeID="nickname-label" style={styles.fieldLabel}>
        {label}
      </Text>
      <View style={styles.nicknameRow}>
        <TextInput
          accessibilityLabel={label}
          accessibilityLabelledBy="nickname-label"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={16}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityLabel={diceLabel}
          accessibilityRole="button"
          onPress={() => {
            feedback.tap();
            onRoll();
          }}
          style={styles.diceButton}
        >
          <PixelIcon color={colors.canvas} name="dice" size={22} />
        </Pressable>
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type ChoiceRowProps<T extends string> = {
  label?: string;
  onSelect: (value: T) => void;
  options: { label: string; value: T }[];
  selected: T;
};

/** A row of chunky toggle chips, e.g. the language picker. */
export function ChoiceRow<T extends string>({ label, onSelect, options, selected }: ChoiceRowProps<T>) {
  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.choiceRow}>
      {options.map((option) => {
        const isActive = option.value === selected;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
            key={option.value}
            onPress={() => {
              feedback.tap();
              onSelect(option.value);
            }}
            style={[styles.choice, isActive && styles.choiceActive]}
          >
            <Text style={[styles.choiceText, isActive && styles.choiceTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SettingSwitchProps = {
  description?: string;
  icon: PixelIconName;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
};

export function SettingSwitch({ description, icon, label, onChange, value }: SettingSwitchProps) {
  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.switchRow}
    >
      <View style={styles.switchIcon}>
        <PixelIcon color={value ? colors.highlight : colors.textMuted} name={icon} size={20} />
      </View>
      <View style={styles.switchText}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description ? <Text style={styles.switchDescription}>{description}</Text> : null}
      </View>
      <Switch
        accessibilityElementsHidden
        // react-native-web colours the thumb with these instead of thumbColor.
        {...({ activeThumbColor: colors.highlight, activeTrackColor: colors.accentSoft } as object)}
        importantForAccessibility="no"
        onValueChange={onChange}
        thumbColor={value ? colors.highlight : colors.textMuted}
        trackColor={{ false: colors.surfaceInset, true: colors.accentSoft }}
        value={value}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarCell: {
    borderColor: 'transparent',
    borderRadius: radii.lg,
    borderWidth: 3,
    padding: 2,
  },
  avatarCellActive: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.highlight,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    flexBasis: 90,
    flexGrow: 1,
    minHeight: 48,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceActive: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.highlight,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceText: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  choiceTextActive: {
    color: colors.textPrimary,
  },
  diceButton: {
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: radii.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: typography.body,
  },
  helper: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: typography.h3,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  nicknameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchDescription: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  switchIcon: {
    alignItems: 'center',
    width: 28,
  },
  switchLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
