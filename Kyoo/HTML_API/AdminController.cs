using Kyoo.InternalAPI;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
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

        [HttpGet("scan/{watch}")]
        public IActionResult ScanLibrary(bool watch)
        {
            crawler.Start(watch);
            return Ok("Scanning");
        }
    }
}
