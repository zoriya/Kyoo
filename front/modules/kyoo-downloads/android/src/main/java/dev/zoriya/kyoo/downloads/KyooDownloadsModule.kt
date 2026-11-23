package dev.zoriya.kyoo.downloads

import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ComponentName
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.PersistableBundle
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import org.json.JSONObject
import java.io.File

class StartOptions : Record {
  @Field var id: String = ""
  @Field var url: String = ""
  @Field var file: String = ""
  @Field var headers: Map<String, String> = emptyMap()
  @Field var title: String = ""
  @Field var texts: Map<String, String> = emptyMap()
}

class SettingsOptions : Record {
  @Field var maxConcurrent: Int = 2
  @Field var allowCellular: Boolean = true
}

class KyooDownloadsModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val scheduler
    get() = context.getSystemService(JobScheduler::class.java)

  private val listener = { state: Map<String, Any?> -> sendEvent("onUpdate", state) }

  override fun definition() = ModuleDefinition {
    Name("KyooDownloads")

    Constant("movies") {
      val dir = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
      Uri.fromFile(dir).toString() + "/"
    }

    Events("onUpdate")

    OnStartObserving { DownloadJobService.listeners.add(listener) }

    OnStopObserving { DownloadJobService.listeners.remove(listener) }

    Function("start") { options: StartOptions ->
      val task = JSONObject()
        .put("url", options.url)
        .put("file", Uri.parse(options.file).path)
        .put("title", options.title)
        .put("headers", JSONObject(options.headers))
        .put("texts", JSONObject(options.texts))
      synchronized(DownloadJobService) {
        DownloadJobService.write(context, options.id, JSONObject().put("status", "pending").put("task", task))
      }
      schedule(options.id)
    }

    Function("pause") { id: String -> DownloadJobService.pause(context, id) }

    Function("resume") { id: String ->
      synchronized(DownloadJobService) {
        val state = DownloadJobService.read(context, id)
        if (state?.getString("status") != "paused") return@Function
        DownloadJobService.write(context, id, state.put("status", "pending"))
      }
      schedule(id)
    }

    AsyncFunction("remove") { id: String, file: String? ->
      val state = synchronized(DownloadJobService) {
        DownloadJobService.read(context, id).also { DownloadJobService.remove(context, id) }
      }
      scheduler.cancel(id.hashCode())
      if (file != null) {
        synchronized(DownloadJobService.locks.getOrPut(id) { Any() }) {
          File(Uri.parse(file).path!!).delete()
        }
      }
      if (state != null && state.getString("status") != "done") {
        runCatching { DownloadJobService.open(state.getJSONObject("task"), "DELETE").responseCode }
      }
    }

    Function("getSettings") {
      val settings = DownloadJobService.settings(context)
      mapOf(
        "maxConcurrent" to settings.getInt("maxConcurrent", 2),
        "allowCellular" to settings.getBoolean("allowCellular", true),
      )
    }

    Function("setSettings") { options: SettingsOptions ->
      val slots = DownloadJobService.slots(context)
      val settings = DownloadJobService.settings(context)
      val maxConcurrent = settings.getInt("maxConcurrent", 2)
      val cellularChanged = settings.getBoolean("allowCellular", true) != options.allowCellular
      settings.edit()
        .putInt("maxConcurrent", options.maxConcurrent)
        .putBoolean("allowCellular", options.allowCellular)
        .commit()
      slots.resize(maxConcurrent, options.maxConcurrent)
      if (!cellularChanged) return@Function
      for ((id, state) in DownloadJobService.readAll(context)) {
        if (state.getString("status") in DownloadJobService.ACTIVE && scheduler.getPendingJob(id.hashCode()) != null) schedule(id)
      }
    }

    Function("getAll") {
      DownloadJobService.readAll(context).map { (id, state) ->
        if (state.getString("status") in DownloadJobService.ACTIVE && scheduler.getPendingJob(id.hashCode()) == null) {
          state.put("status", "failed").put("error", "Download interrupted")
        }
        state.keys().asSequence().filter { it != "task" }.associateWith { state.get(it) } + ("id" to id)
      }
    }
  }

  private fun schedule(id: String) {
    val job = JobInfo.Builder(id.hashCode(), ComponentName(context, DownloadJobService::class.java))
      .setRequiredNetworkType(
        if (DownloadJobService.settings(context).getBoolean("allowCellular", true)) JobInfo.NETWORK_TYPE_ANY else JobInfo.NETWORK_TYPE_UNMETERED,
      )
      .setPersisted(true)
      .setExtras(PersistableBundle().apply { putString("id", id) })
      .apply { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) setUserInitiated(true) }
      .build()
    if (scheduler.schedule(job) != JobScheduler.RESULT_SUCCESS) {
      synchronized(DownloadJobService) {
        DownloadJobService.read(context, id)?.let {
          DownloadJobService.write(context, id, it.put("status", "failed").put("error", "Could not schedule the download"))
        }
      }
      throw CodedException("Could not schedule the download")
    }
  }
}
