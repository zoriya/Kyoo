using Kyoo.Models;
using System;
using System.IO;
using System.Net;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public class ThumbnailsManager : IThumbnailsManager
    {
        public Show Validate(Show show)
        {
            string localThumb = Path.Combine(show.Path, "poster.jpg");
            if (!File.Exists(localThumb))
            {
                using (WebClient client = new WebClient())
                {
                    client.DownloadFileAsync(new Uri(show.ImgPrimary), localThumb);
                }
            }

            show.ImgPrimary = localThumb;
            return show;
        }

        public Episode Validate(Episode episode)
        {
            string localThumb = Path.ChangeExtension(episode.Path, "jpg");
            if (!File.Exists(localThumb))
            {
                using (WebClient client = new WebClient())
                {
                    client.DownloadFileAsync(new Uri(episode.ImgPrimary), localThumb);
                }
            }

            episode.ImgPrimary = localThumb;
            return episode;
        }
    }
}
