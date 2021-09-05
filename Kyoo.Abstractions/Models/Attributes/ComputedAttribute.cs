using System;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// An attribute to inform that the property is computed automatically and can't be assigned manually.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class ComputedAttribute : NotMergeableAttribute { }
}
