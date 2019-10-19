using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI.ThumbnailsManager
{
    public class ThumbnailsManager : IThumbnailsManager
    {
        private readonly IConfiguration config;

        public ThumbnailsManager(IConfiguration configuration)
        {
            config = configuration;
        }

        public async Task<Show> Validate(Show show)
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
                        await client.DownloadFileTaskAsync(new Uri(show.ImgPrimary), localThumb);
                    }
                }
            }

            if (show.ImgLogo != null)
            {
                if (!File.Exists(localLogo))
                {
                    using (WebClient client = new WebClient())
                    {
                        await client.DownloadFileTaskAsync(new Uri(show.ImgLogo), localLogo);
                    }
                }
            }

            if (show.ImgBackdrop != null)
            {
                if (!File.Exists(localBackdrop))
                {
                    using (WebClient client = new WebClient())
                    {
                        await client.DownloadFileTaskAsync(new Uri(show.ImgBackdrop), localBackdrop);
                    }
                }
            }

            return show;
        }

        public async Task<List<People>> Validate(List<People> people)
        {
            for (int i = 0; i < people?.Count; i++)
            {
                string root = config.GetValue<string>("peoplePath");
                Directory.CreateDirectory(root);

                string localThumb = root + "/" + people[i].slug + ".jpg";
                if (people[i].imgPrimary != null && !File.Exists(localThumb))
                {
                    using (WebClient client = new WebClient())
                    {
                        Debug.WriteLine("&" + localThumb);
                        await client.DownloadFileTaskAsync(new Uri(people[i].imgPrimary), localThumb);
                    }
                }
            }

            return people;
        }

        public async Task<Episode> Validate(Episode episode)
        {
            //string localThumb = Path.ChangeExtension(episode.Path, "jpg");            
            string localThumb = episode.Path.Replace(Path.GetExtension(episode.Path), "-thumb.jpg");
            if (episode.ImgPrimary != null && !File.Exists(localThumb))
            {
                using (WebClient client = new WebClient())
                {
                    await client.DownloadFileTaskAsync(new Uri(episode.ImgPrimary), localThumb);
                }
            }

            return episode;
        }
    }
}
