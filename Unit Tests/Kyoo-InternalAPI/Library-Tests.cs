using Kyoo.InternalAPI;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

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
