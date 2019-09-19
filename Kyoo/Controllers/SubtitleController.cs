using Kyoo.InternalAPI;
using Kyoo.Models;
using Kyoo.Models.Watch;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    //[ApiController]
    public class SubtitleController : ControllerBase
    {
        private readonly ILibraryManager libraryManager;
        private readonly ITranscoder transcoder;

        public SubtitleController(ILibraryManager libraryManager, ITranscoder transcoder)
        {
            this.libraryManager = libraryManager;
            this.transcoder = transcoder;
        }

        [HttpGet("{showSlug}-s{seasonNumber:int}e{episodeNumber:int}.{identifier}.{extension?}")]
        public IActionResult GetSubtitle(string showSlug, int seasonNumber, int episodeNumber, string identifier, string extension)
        {
            string languageTag = identifier.Substring(0, 3);
            bool forced = identifier.Length > 3 && identifier.Substring(4) == "forced";

            Track subtitle = libraryManager.GetSubtitle(showSlug, seasonNumber, episodeNumber, languageTag, forced);

            if (subtitle == null)
                return NotFound();


            if (subtitle.Codec == "subrip" && extension == "vtt") //The request wants a WebVTT from a Subrip subtitle, convert it on the fly and send it.
            {
                return new ConvertSubripToVtt(subtitle.Path);
            }

            string mime;
            if (subtitle.Codec == "ass")
                mime = "text/x-ssa";
            else
                mime = "application/x-subrip";

            //Should use appropriate mime type here
            return PhysicalFile(subtitle.Path, mime);
        }

        [HttpGet("extract/{showSlug}-s{seasonNumber}e{episodeNumber}")]
        public string ExtractSubtitle(string showSlug, long seasonNumber, long episodeNumber)
        {
            Episode episode = libraryManager.GetEpisode(showSlug, seasonNumber, episodeNumber);
            libraryManager.ClearSubtitles(episode.id);

            Track[] tracks = transcoder.ExtractSubtitles(episode.Path);
            foreach (Track track in tracks)
            {
                track.episodeID = episode.id;
                libraryManager.RegisterTrack(track);
            }

            return "Done. " + tracks.Length + " track(s) extracted.";
        }

        [HttpGet("extract/{showSlug}")]
        public string ExtractSubtitle(string showSlug)
        {
            List<Episode> episodes = libraryManager.GetEpisodes(showSlug);
            foreach (Episode episode in episodes)
            {
                libraryManager.ClearSubtitles(episode.id);

                Track[] tracks = transcoder.ExtractSubtitles(episode.Path);
                foreach (Track track in tracks)
                {
                    track.episodeID = episode.id;
                    libraryManager.RegisterTrack(track);
                }
            }

            return "Done.";
        }
    }


    public class ConvertSubripToVtt : IActionResult
    {
        private string path;
        private string lastLine = "";

        public ConvertSubripToVtt(string subtitlePath)
        {
            path = subtitlePath;
        }

        public async Task ExecuteResultAsync(ActionContext context)
        {
            context.HttpContext.Response.StatusCode = 200;
            //HttpContext.Response.Headers.Add("Content-Disposition", "attachement");
            context.HttpContext.Response.Headers.Add("Content-Type", "text/vtt");

            using (StreamWriter writer = new StreamWriter(context.HttpContext.Response.Body))
            {
                await writer.WriteLineAsync("WEBVTT");
                await writer.WriteLineAsync("");
                await writer.WriteLineAsync("");

                string line;
                using (StreamReader reader = new StreamReader(path))
                {
                    while ((line = await reader.ReadLineAsync()) != null)
                    {
                        string processedLine = ConvertLine(line);
                        if(processedLine != null)
                            await writer.WriteLineAsync(processedLine);

                        lastLine = processedLine;
                    }
                }
            }

            await context.HttpContext.Response.Body.FlushAsync();
        }

        public string ConvertLine(string line)
        {
            if (lastLine == "")
                line = null;

            if (lastLine == null) //The line is a timecode only if the last line is an index line and we already set it to null.
                line = line.Replace(',', '.'); //This is never called.

            return line;
        }
    }
}