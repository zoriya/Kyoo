using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// A custom <see cref="HttpGetAttribute"/> that indicate an alternatives, hidden route.
	/// </summary>
	public class AltHttpGetAttribute : HttpGetAttribute
	{
		/// <summary>
		/// Create a new <see cref="AltHttpGetAttribute"/>.
		/// </summary>
		/// <param name="template">The route template, see <see cref="RouteAttribute.Template"/>.</param>
		public AltHttpGetAttribute([NotNull] [RouteTemplateAttribute] string template)
			: base(template)
		{ }
	}
}
