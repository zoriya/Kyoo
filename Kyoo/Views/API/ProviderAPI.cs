using System.Collections.Generic;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Api
{
	[Route("api/provider")]
	[Route("api/providers")]
	[ApiController]
	public class ProviderAPI : ControllerBase
	{
		private readonly DatabaseContext _database;
		
		public ProviderAPI(DatabaseContext database)
		{
			_database = database;
		}
		
		[HttpGet("")]
		[Authorize(Policy="Read")]
		public ActionResult<IEnumerable<ProviderID>> Index()
		{
			return _database.Providers;
		}
	}
}