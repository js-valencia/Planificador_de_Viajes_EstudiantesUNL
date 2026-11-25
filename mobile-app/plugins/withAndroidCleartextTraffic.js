const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Android 9+ bloquea HTTP sin cifrar en compilaciones release.
 * Activa `usesCleartextTraffic` solo cuando la API configurada usa http://.
 */
module.exports = function withAndroidCleartextTraffic(config, { enabled } = {}) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$ = {
        ...application.$,
        'android:usesCleartextTraffic': enabled ? 'true' : 'false',
      };
    }
    return modConfig;
  });
};
