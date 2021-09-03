using System.Diagnostics.CodeAnalysis;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A permission validator that always validate permissions. This effectively disable the permission system.
	/// </summary>
	public class PassthroughPermissionValidator : IPermissionValidator
	{
		[SuppressMessage("ReSharper", "SuggestBaseTypeForParameterInConstructor",
			Justification = "ILogger should include the typeparam for context.")]
		public PassthroughPermissionValidator(ILogger<PassthroughPermissionValidator> logger)
		{
			logger.LogWarning("No permission validator has been enabled, all users will have all permissions");
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PermissionAttribute attribute)
		{
			return new PassthroughValidator();
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PartialPermissionAttribute attribute)
		{
			return new PassthroughValidator();
		}

		/// <summary>
		/// An useless filter that does nothing.
		/// </summary>
		private class PassthroughValidator : IFilterMetadata { }
	}
}
