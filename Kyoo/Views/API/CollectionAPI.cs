using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Kyoo.CommonApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/collection")]
	[Route("api/collections")]
	[ApiController]
	public class CollectionApi : CrudApi<Collection>
	{
		public CollectionApi(ICollectionRepository repository, IConfiguration configuration) 
			: base(repository, configuration)
		{ }
	}
}