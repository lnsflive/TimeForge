// Synology Node 20/22 crashes while iterating Intl.Segmenter results.
// Build-tool text formatting uses its normal fallback; browser code is unchanged.
if (require('node:fs').existsSync('/etc/synoinfo.conf')) {
  Intl.Segmenter = undefined
}
