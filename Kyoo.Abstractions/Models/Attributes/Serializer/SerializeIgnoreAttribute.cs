using System;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// Remove an property from the serialization pipeline. It will simply be skipped.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeIgnoreAttribute : Attribute { }
}
