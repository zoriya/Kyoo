using System;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// Remove a property from the deserialization pipeline. The user can't input value for this property.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class DeserializeIgnoreAttribute : Attribute { }
}
