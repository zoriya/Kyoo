using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public class ThumbnailsManager : IThumbnailsManager
    {
        private readonly IConfiguration config;

        public ThumbnailsManager(IConfiguration configuration)
        {
            config = configuration;
        }

        public Show Validate(Show show)
        {
            string localThumb = Path.Combine(show.Path, "poster.jpg");
            string localLogo = Path.Combine(show.Path, "logo.png");
            string localBackdrop = Path.Combine(show.Path, "backdrop.jpg");


            if (show.ImgPrimary != null)
            {
                if (!File.Exists(localThumb))
                {
                    using (WebClient client = new WebClient())
                    {
                        client.DownloadFileAsync(new Uri(show.ImgPrimary), localThumb);
                    }
                }
            }
            show.ImgPrimary = localThumb;

            if (show.ImgLogo != null)
            {
                if (!File.Exists(localLogo))
                {
                    using (WebClient client = new WebClient())
                    {
                        client.DownloadFileAsync(new Uri(show.ImgLogo), localLogo);
                    }
                }
            }
            show.ImgLogo = localLogo;

            if (show.ImgBackdrop != null)
            {
                if (!File.Exists(localBackdrop))
                {
                    using (WebClient client = new WebClient())
                    {
                        client.DownloadFileAsync(new Uri(show.ImgBackdrop), localBackdrop);
                    }
                }
            }
            show.ImgBackdrop = localBackdrop;

            return show;
        }

        public List<People> Validate(List<People> people)
        {
            for (int i = 0; i < people?.Count; i++)
            {
                string root = config.GetValue<string>("peoplePath");
                Directory.CreateDirectory(root);

                string localThumb = root + "/" + people[i].slug + ".jpg";
                if (!File.Exists(localThumb))
                {
                    using (WebClient client = new WebClient())
                    {
                        Debug.WriteLine("&" + localThumb);
                        client.DownloadFileAsync(new Uri(people[i].imgPrimary), localThumb);
                    }
                }

                people[i].imgPrimary = localThumb;
            }

            return people;
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
