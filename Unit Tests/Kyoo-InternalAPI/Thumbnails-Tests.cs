using Kyoo;
using Kyoo.InternalAPI;
using Kyoo.InternalAPI.ThumbnailsManager;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace UnitTests.Kyoo_InternalAPI
{
    public class Tests
    {
        private IConfiguration config;

        [SetUp]
        public void Setup()
        {
            config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
        }

        [Test]
        public async Task DownloadShowImages()
        {
            LibraryManager library = new LibraryManager(config);
            ThumbnailsManager manager = new ThumbnailsManager(config);
            Show show = library.GetShowBySlug(library.QueryShows(null).FirstOrDefault().Slug);
            Debug.WriteLine("&Show: " + show.Path);
            string posterPath = Path.Combine(show.Path, "poster.jpg");
            File.Delete(posterPath);

            await manager.Validate(show);
            long posterLength = new FileInfo(posterPath).Length;
            Assert.IsTrue(posterLength > 0, "Poster size is zero for the tested show (" + posterPath + ")");
        }
    }
}
