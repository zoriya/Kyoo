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

            string localBackdrop = Path.Combine(show.Path, "backdrop.jpg");
            if (!File.Exists(localBackdrop))
            {
                using (WebClient client = new WebClient())
                {
                    client.DownloadFileAsync(new Uri(show.ImgBackdrop), localBackdrop);
                }
            }

            show.ImgPrimary = localThumb;
            show.ImgBackdrop = localBackdrop;
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
