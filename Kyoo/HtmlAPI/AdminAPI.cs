using Microsoft.AspNetCore.Mvc;
using System.Threading;

namespace Kyoo.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
	    [HttpGet("scan")]
        public IActionResult ScanLibrary([FromServices] ICrawler crawler)
        {
            crawler.StartAsync(new CancellationToken());
            return Ok("Scanning");
        }
    }
}
