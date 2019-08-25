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
            if (show.ImgPrimary != null)
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
            }

            if(show.ImgBackdrop != null)
            {
                string localBackdrop = Path.Combine(show.Path, "backdrop.jpg");
                if (!File.Exists(localBackdrop))
                {
                    using (WebClient client = new WebClient())
                    {
                        client.DownloadFileAsync(new Uri(show.ImgBackdrop), localBackdrop);
                    }
                }
                show.ImgBackdrop = localBackdrop;
            }

            return show;
        }

        public List<People> Validate(List<People> people)
        {
            for (int i = 0; i < people?.Count; i++)
            {
                string localThumb = config.GetValue<string>("peoplePath") + "/" + people[i].slug + ".jpg";
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
