import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { colors, fonts, radii, spacing, typography } from '../../theme/tokens';
import { parseRoomCode } from './room-join-link';

/**
 * Reads a room QR code (or a code shown as text) with the camera. Frames stay on the device:
 * nothing is recorded or sent, only the six-character code is used.
 */
export function RoomQrScanner({ onClose, onCode }: { onClose: () => void; onCode: (code: string) => void }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('qr.title')}
          </Text>
          {permission?.granted ? (
            <View style={styles.viewfinder}>
              <CameraView
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                facing="back"
                onBarcodeScanned={({ data }) => {
                  const code = parseRoomCode(data);

                  if (code && !handled.current) {
                    handled.current = true;
                    onCode(code);
                  }
                }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            <>
              <Text style={styles.note}>{permission && !permission.canAskAgain ? t('qr.denied') : t('qr.why')}</Text>
              {permission?.canAskAgain !== false ? (
                <PrimaryButton label={t('qr.allow')} onPress={() => void requestPermission()} />
              ) : null}
            </>
          )}
          <Text style={styles.note}>{t('qr.hint')}</Text>
          <SecondaryButton label={t('qr.close')} onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.canvas,
    gap: spacing.md,
    maxWidth: 420,
    width: '100%',
  },
  note: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: typography.body,
    lineHeight: 22,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: typography.h2,
  },
  viewfinder: {
    aspectRatio: 1,
    borderColor: colors.highlight,
    borderRadius: radii.lg,
    borderWidth: 3,
    overflow: 'hidden',
    width: '100%',
  },
});
