using Kyoo.InternalAPI;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;

namespace UnitTests.Kyoo_InternalAPI
{
    public class LibraryTests
    {
        private IConfiguration config;
        private ILibraryManager libraryManager;

        [SetUp]
        public void Setup()
        {
            config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
            libraryManager = new LibraryManager(config);
        }
    }
}
