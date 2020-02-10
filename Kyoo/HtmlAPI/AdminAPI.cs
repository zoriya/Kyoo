using Kyoo.Controllers;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ICrawler crawler;

        public AdminController(ICrawler crawler)
        {
            this.crawler = crawler;
        }

        [HttpGet("scan")]
        public IActionResult ScanLibrary()
        {
            crawler.StartAsync(new CancellationToken());
            return Ok("Scanning");
        }
    }
}
