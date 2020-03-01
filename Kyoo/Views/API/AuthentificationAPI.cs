using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	public class AuthentificationAPI : Controller
	{
		// [Authorize, HttpGet("/connect/authorize")]
		// public async Task<IActionResult> Authorize(CancellationToken token)
		// {
		//	 //HttpContext.GetOpenIdConnectResponse()
		// }
	}
}