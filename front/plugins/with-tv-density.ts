import { type ConfigPlugin, withMainActivity } from "expo/config-plugins";

// android tv sets content size to 960x540 instead of real size, this doesn't
// work well for kyoo since the page is built around web breakpoints.
const TV_DENSITY_SCALE = 0.75;

const CLASS_DECLARATION = "class MainActivity : ReactActivity() {";
const SUPER_ON_CREATE = "super.onCreate(null)";

const IMPORTS = [
	"import android.content.res.Configuration",
	"import android.util.DisplayMetrics",
	"import com.facebook.react.uimanager.DisplayMetricsHolder",
];

const METHODS = `
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applyTvDensity()
  }

  private fun applyTvDensity() {
    if (resources.configuration.uiMode and Configuration.UI_MODE_TYPE_MASK !=
        Configuration.UI_MODE_TYPE_TELEVISION) return

    for (res in listOf(applicationContext.resources, resources)) {
      val metrics = res.displayMetrics
      metrics.densityDpi = (res.configuration.densityDpi * ${TV_DENSITY_SCALE}f).toInt()
      metrics.density = metrics.densityDpi / 160f
      metrics.scaledDensity = metrics.density * res.configuration.fontScale
    }
    DisplayMetricsHolder.setWindowDisplayMetrics(applicationContext.resources.displayMetrics)
    DisplayMetricsHolder.setScreenDisplayMetrics(
      DisplayMetrics().apply { setTo(resources.displayMetrics) }
    )
  }
`;

export const patchMainActivity = (contents: string) => {
	if (contents.includes("applyTvDensity")) return contents;
	for (const anchor of [CLASS_DECLARATION, SUPER_ON_CREATE])
		if (!contents.includes(anchor))
			throw new Error(`with-tv-density: MainActivity has no ${anchor}`);

	const missing = IMPORTS.filter((x) => !contents.includes(x));
	return contents
		.replace(CLASS_DECLARATION, `${CLASS_DECLARATION}\n${METHODS}`)
		.replace(SUPER_ON_CREATE, `${SUPER_ON_CREATE}\n    applyTvDensity()`)
		.replace(/^(package .*)$/m, `$1\n\n${missing.join("\n")}`);
};

export const withTvDensity: ConfigPlugin = (config) =>
	withMainActivity(config, (config) => {
		if (process.env.EXPO_TV !== "1") return config;
		if (config.modResults.language !== "kt")
			throw new Error("with-tv-density: expected a kotlin MainActivity");

		config.modResults.contents = patchMainActivity(config.modResults.contents);
		return config;
	});

export default withTvDensity;
