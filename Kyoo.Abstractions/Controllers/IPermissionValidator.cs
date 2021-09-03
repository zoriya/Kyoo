using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A service to validate permissions.
	/// </summary>
	public interface IPermissionValidator
	{
		/// <summary>
		/// Create an IAuthorizationFilter that will be used to validate permissions.
		/// This can registered with any lifetime.
		/// </summary>
		/// <param name="attribute">The permission attribute to validate.</param>
		/// <returns>An authorization filter used to validate the permission.</returns>
		IFilterMetadata Create(PermissionAttribute attribute);

		/// <summary>
		/// Create an IAuthorizationFilter that will be used to validate permissions.
		/// This can registered with any lifetime.
		/// </summary>
		/// <param name="attribute">
		/// A partial attribute to validate. See <see cref="PartialPermissionAttribute"/>.
		/// </param>
		/// <returns>An authorization filter used to validate the permission.</returns>
		IFilterMetadata Create(PartialPermissionAttribute attribute);
	}
}
