const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Keep Android from mirroring the entire native view tree when the device
 * language is Persian. The app applies RTL explicitly to Persian copy and
 * LTR explicitly to course-language copy, so OS-level mirroring would invert
 * already-correct text alignment and row order.
 */
module.exports = function withStableLayoutDirection(config) {
  return withAndroidManifest(config, androidConfig => {
    const application = androidConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$ = application.$ || {};
      application.$['android:supportsRtl'] = 'false';
    }
    return androidConfig;
  });
};
