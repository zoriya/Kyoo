using System;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// The targeted relation can be edited via calls to the repository's <see cref="IRepository{T}.Edit"/> method.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class EditableRelationAttribute : Attribute { }
}
