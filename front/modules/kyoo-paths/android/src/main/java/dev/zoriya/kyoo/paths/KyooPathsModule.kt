package dev.zoriya.kyoo.paths

import android.net.Uri
import android.os.Environment
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KyooPathsModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("KyooPaths")

    Constant("movies") {
      val dir = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
      Uri.fromFile(dir).toString() + "/"
    }
  }
}
