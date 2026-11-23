package dev.zoriya.kyoo.downloads

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.app.job.JobScheduler
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.Semaphore

class DownloadJobService : JobService() {
  private val runs = ConcurrentHashMap<Int, Run>()

  override fun onStartJob(params: JobParameters): Boolean {
    val run = Run(params)
    runs[params.jobId] = run
    run.showNotification()
    run.start()
    return true
  }

  override fun onStopJob(params: JobParameters): Boolean {
    runs.remove(params.jobId)?.cancel()
	// removed downloads are not rescheduled
    return read(this, params.extras.getString("id")!!)?.getString("status") in ACTIVE
  }

  inner class Run(private val params: JobParameters) : Thread() {
    private val id = params.extras.getString("id")!!
    private var state = read(this@DownloadJobService, id) ?: JSONObject()
    private val task = state.optJSONObject("task") ?: JSONObject()
    private val file = File(task.optString("file"))
    private var lastSave = 0L
    @Volatile private var stopped = false
    @Volatile private var conn: HttpURLConnection? = null
    private var slot = false

    fun cancel() {
      stopped = true
      conn?.disconnect()
      interrupt()
    }

    override fun run() {
      synchronized(locks.getOrPut(id) { Any() }) {
        val reschedule = try {
          state = read(this@DownloadJobService, id) ?: JSONObject()
          if (state.optString("status") !in ACTIVE) false else download()
        } catch (e: Exception) {
          if (!stopped) Log.w(TAG, "download of $id failed, retrying later", e)
          true
        } finally {
          release()
        }
        if (!stopped) jobFinished(params, reschedule)
      }
    }

    private fun release() {
      if (!slot) return
      slot = false
      slots(this@DownloadJobService).release()
    }

    private fun download(): Boolean {
      while (!stopped) {
        val etag = state.optString("etag").ifEmpty { null }
        val offset = if (etag != null) file.length() else 0L
        val c = open(task, "GET")
        conn = c
        if (offset > 0) {
          c.setRequestProperty("Range", "bytes=$offset-")
          c.setRequestProperty("If-Range", etag)
        }
        when (val code = c.responseCode) {
          202 -> {
            val body = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            release()
            save(true) {
              put("status", body.optString("status", "preparing"))
              put("progress", body.optDouble("progress", 0.0))
            }
            sleep(1000 * (c.getHeaderField("Retry-After")?.toLongOrNull() ?: 5))
            continue
          }
          200, 206 -> {
            if (!slot && !slots(this@DownloadJobService).tryAcquire()) {
              c.disconnect()
              save(true) { put("status", "queued") }
              slots(this@DownloadJobService).acquire()
              slot = true
              continue
            }
            slot = true
            val start = if (code == 206) offset else 0
            val length = c.contentLengthLong
            save(true) {
              put("status", "downloading")
              put("etag", c.getHeaderField("ETag"))
              put("bytes", start)
              put("total", if (length >= 0) start + length else -1)
            }
            FileOutputStream(file, start > 0).use { output ->
              c.inputStream.use { input ->
                val buffer = ByteArray(64 * 1024)
                var bytes = start
                while (!stopped) {
                  val read = input.read(buffer)
                  if (read < 0) break
                  output.write(buffer, 0, read)
                  bytes += read
                  save { put("bytes", bytes) }
                }
              }
            }
            if (stopped) return true
          }
          416 -> {}
          else -> {
            val body = c.errorStream?.bufferedReader()?.use { it.readText() }
            val error = runCatching { JSONObject(body!!) }.getOrNull()
            val failed = error?.optString("status") == "failed" || (code in 400..499 && code != 408 && code != 429)
            if (!failed) return true
            save(true) {
              put("status", "failed")
              put("error", error?.optString("error")?.ifEmpty { null } ?: "HTTP $code")
            }
            return false
          }
        }
        save(true) {
          put("status", "done")
          put("bytes", file.length())
          put("total", file.length())
        }
        runCatching { open(task, "DELETE").responseCode }
        return false
      }
      return true
    }

    private fun save(force: Boolean = false, edit: JSONObject.() -> Unit) {
      state.edit()
      val now = SystemClock.elapsedRealtime()
      if (stopped || (!force && now - lastSave < 1000)) return
      lastSave = now
      synchronized(DownloadJobService) {
        if (read(this@DownloadJobService, id)?.getString("status") !in ACTIVE) {
          stopped = true
          return
        }
        write(this@DownloadJobService, id, state)
      }
      showNotification()
    }

    fun showNotification() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return
      val context = this@DownloadJobService
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(NotificationChannel("downloads", "Downloads", NotificationManager.IMPORTANCE_LOW))
      val status = state.optString("status", "pending")
      val total = state.optLong("total", -1)
      val texts = task.optJSONObject("texts") ?: JSONObject()
      val indeterminate = status == "pending" || status == "queued" || (status == "downloading" && total <= 0)
      val percent = if (status == "preparing") state.optDouble("progress", 0.0).toInt() else (state.optLong("bytes") * 100 / maxOf(total, 1)).toInt()
      val notification = Notification.Builder(context, "downloads")
        .setSmallIcon(resources.getIdentifier("notification_icon", "drawable", packageName))
        .setContentTitle(task.optString("title"))
        .setContentText(texts.optString(status))
        .setSubText(if (indeterminate) null else "$percent%")
        .setOnlyAlertOnce(true)
        .setProgress(100, percent, indeterminate)
        .addAction(
          Notification.Action.Builder(
            null,
            texts.optString("pause"),
            PendingIntent.getBroadcast(
              context,
              params.jobId,
              Intent(context, PauseReceiver::class.java).putExtra("id", id),
              PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            ),
          ).build(),
        )
        .setContentIntent(
          PendingIntent.getActivity(
            context,
            0,
            Intent(Intent.ACTION_VIEW, Uri.parse("kyoo:///downloads")).setPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE,
          ),
        ).build()
      setNotification(params, params.jobId, notification, JOB_END_NOTIFICATION_POLICY_REMOVE)
    }
  }

  companion object {
    const val TAG = "KyooDownloads"

    val ACTIVE = setOf("pending", "preparing", "queued", "downloading")

    val listeners = CopyOnWriteArraySet<(Map<String, Any?>) -> Unit>()

    val locks = ConcurrentHashMap<String, Any>()

    class Slots(permits: Int) : Semaphore(permits) {
      fun resize(from: Int, to: Int) = if (to > from) release(to - from) else reducePermits(from - to)
    }

    private var slots: Slots? = null

    fun slots(context: Context) = synchronized(this) {
      slots ?: Slots(settings(context).getInt("maxConcurrent", 2)).also { slots = it }
    }

    private fun prefs(context: Context) = context.getSharedPreferences("kyoo-downloads", Context.MODE_PRIVATE)

    fun settings(context: Context) = context.getSharedPreferences("kyoo-downloads-settings", Context.MODE_PRIVATE)

    fun read(context: Context, id: String): JSONObject? = prefs(context).getString(id, null)?.let { JSONObject(it) }

    fun readAll(context: Context): Map<String, JSONObject> =
      prefs(context).all.mapValues { (_, raw) -> JSONObject(raw as String) }

    fun write(context: Context, id: String, state: JSONObject) {
      prefs(context).edit().putString(id, state.toString()).apply()
      val map = state.keys().asSequence().filter { it != "task" }.associateWith { state.get(it) } + ("id" to id)
      listeners.forEach { it(map) }
    }

    fun remove(context: Context, id: String) = prefs(context).edit().remove(id).apply()

    fun pause(context: Context, id: String) {
      synchronized(DownloadJobService) {
        val state = read(context, id)
        if (state?.getString("status") !in ACTIVE) return
        write(context, id, state!!.put("status", "paused"))
      }
      context.getSystemService(JobScheduler::class.java).cancel(id.hashCode())
    }

    fun open(task: JSONObject, method: String): HttpURLConnection {
      val conn = URL(task.getString("url")).openConnection() as HttpURLConnection
      conn.requestMethod = method
      conn.connectTimeout = 30_000
      conn.readTimeout = 60_000
      val headers = task.getJSONObject("headers")
      for (key in headers.keys()) conn.setRequestProperty(key, headers.getString(key))
      return conn
    }
  }
}

class PauseReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    DownloadJobService.pause(context, intent.getStringExtra("id") ?: return)
  }
}
